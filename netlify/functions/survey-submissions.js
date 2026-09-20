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

async function apiFetch(path, token) {
  const result = await fetch(`${API_ROOT}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!result.ok) {
    const detail = await result.text();
    throw new Error(`Netlify API returned ${result.status}${detail ? `: ${detail.slice(0, 180)}` : ""}`);
  }
  return result.json();
}

exports.handler = async function handler(event, context) {
  if (event.httpMethod !== "GET") return response(405, { error: "Method not allowed." });
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
    const forms = await apiFetch(`/sites/${encodeURIComponent(siteId)}/forms`, token);
    const form = forms.find(item => item.name === FORM_NAME);
    if (!form) return response(404, { error: `No Netlify Form named ${FORM_NAME} was found.` });

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
