"use strict";

const API_ROOT = "https://api.netlify.com/api/v1";
const FORM_NAME = process.env.NETLIFY_FORM_NAME || "ahp-survey";

function response(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
    },
    body: JSON.stringify(payload),
  };
}

function ownerUser(context) {
  const user = context && context.clientContext && context.clientContext.user;
  const roles = user && user.app_metadata && Array.isArray(user.app_metadata.roles)
    ? user.app_metadata.roles
    : [];
  return user && roles.includes("owner") ? user : null;
}

async function apiFetch(path, token, options = {}) {
  const result = await fetch(`${API_ROOT}${path}`, {
    method: options.method || "GET",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(options.headers || {}) },
    body: options.body,
  });
  if (!result.ok) {
    const detail = await result.text();
    throw new Error(`Netlify API returned ${result.status}${detail ? `: ${detail.slice(0, 180)}` : ""}`);
  }
  if (result.status === 204) return null;
  const text = await result.text();
  return text ? JSON.parse(text) : null;
}

async function findForm(siteId, token) {
  const forms = await apiFetch(`/sites/${encodeURIComponent(siteId)}/forms`, token);
  return forms.find(item => item.name === FORM_NAME) || null;
}

async function deleteSubmissionState(formId, token, state) {
  let deleted = 0;
  for (let pass = 0; pass < 20; pass += 1) {
    const stateQuery = state ? `&state=${encodeURIComponent(state)}` : "";
    const batch = await apiFetch(`/forms/${encodeURIComponent(formId)}/submissions?per_page=100&page=1${stateQuery}`, token);
    if (!batch.length) return deleted;
    for (let start = 0; start < batch.length; start += 10) {
      const group = batch.slice(start, start + 10);
      await Promise.all(group.map(item => apiFetch(`/submissions/${encodeURIComponent(item.id)}`, token, { method: "DELETE" })));
      deleted += group.length;
    }
  }
  throw new Error(`Deletion stopped after ${deleted} submissions. Run the clear action again to remove any remaining records.`);
}

async function deleteAllSubmissions(formId, token) {
  const verified = await deleteSubmissionState(formId, token, "");
  const spam = await deleteSubmissionState(formId, token, "spam");
  return { verified, spam, total: verified + spam };
}

exports.handler = async function handler(event, context) {
  if (!["GET", "DELETE"].includes(event.httpMethod)) return response(405, { error: "Method not allowed." });
  if (!ownerUser(context)) return response(403, { error: "Owner access is required." });

  const token = process.env.NETLIFY_ACCESS_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;
  if (!token || !siteId) {
    return response(503, {
      error: "The live dashboard is not configured.",
      setup: "Add NETLIFY_ACCESS_TOKEN and NETLIFY_SITE_ID to the site's environment variables, then redeploy.",
    });
  }

  try {
    const form = await findForm(siteId, token);
    if (!form) return response(404, { error: `No Netlify Form named ${FORM_NAME} was found.` });

    if (event.httpMethod === "DELETE") {
      let body = {};
      try { body = JSON.parse(event.body || "{}"); } catch (_) { return response(400, { error: "Invalid confirmation request." }); }
      if (body.confirmation !== "CLEAR ALL DATA") {
        return response(400, { error: "Type CLEAR ALL DATA to confirm permanent deletion." });
      }
      const deleted = await deleteAllSubmissions(form.id, token);
      return response(200, {
        form: { id: form.id, name: form.name },
        deleted: deleted.total,
        deletedVerified: deleted.verified,
        deletedSpam: deleted.spam,
        clearedAt: new Date().toISOString(),
      });
    }

    const submissions = [];
    const perPage = 100;
    for (let page = 1; page <= 10; page += 1) {
      const batch = await apiFetch(`/forms/${encodeURIComponent(form.id)}/submissions?per_page=${perPage}&page=${page}`, token);
      submissions.push(...batch);
      if (batch.length < perPage) break;
    }

    return response(200, {
      form: { id: form.id, name: form.name },
      retrievedAt: new Date().toISOString(),
      truncated: submissions.length === 1000,
      submissions: submissions.map(item => ({
        id: item.id,
        created_at: item.created_at,
        data: item.data || {},
      })),
    });
  } catch (error) {
    return response(502, { error: "Netlify submissions could not be retrieved.", detail: error.message });
  }
};
