# Malawi Solar PV AHP Stakeholder Survey

Static research survey prepared for deployment on Netlify.

## Deploy on Netlify

1. Connect the project to a Git repository or deploy the extracted project with Netlify CLI. A drag-and-drop deploy cannot bundle the protected server-side function used by the live owner dashboard.
2. Netlify reads `netlify.toml`; the publish directory is `dist` and the functions directory is `netlify/functions`.
3. Add `NETLIFY_SITE_ID` and the secret `NETLIFY_ACCESS_TOKEN` under Site configuration → Environment variables, then redeploy.
4. After the first deployment, open **Forms** in the Netlify site dashboard and confirm that `ahp-survey` appears.
5. Enable form-submission notifications if required.
6. Submit at least two pilot records and verify all profile fields, `responses_json`, `weights_json` and `cr_json` in the Netlify Forms export.

## Site pages

- `index.html` — respondent questionnaire with live CR feedback and missing-response flags.
- `framework.html` — complete proposed unweighted framework for respondents, including all six dimensions, 27 subcriteria, definitions and source basis.
- `/owner/` — owner-only live analysis workspace. It retrieves `ahp-survey` submissions through a role-protected server-side function, refreshes every 15 seconds and retains CSV import as a backup.

The owner page aggregates accepted individual matrices by geometric mean, recalculates group CR, produces local and global weights, exports the weighted framework, and flags missing pairs or modules. The Netlify access token remains server-side and is never sent to the browser.

## Scientific behaviour

- Formal consistency ratio is calculated only after a matrix is complete.
- Incomplete matrices receive live triad-based preliminary feedback. A warning appears when a completed three-item cycle differs from its implied relationship by more than a factor of 2; this warning is diagnostic and is not reported as a formal CR.
- A respondent cannot continue while the completed matrix has CR greater than 0.10. The comparison producing the largest reduction in CR during one-pair sensitivity testing is highlighted for review.
- Weights use row geometric means; CR uses Saaty's random indices: 0.90 (n=4), 1.12 (n=5), and 1.24 (n=6).
- Respondents select the more important item and an intensity from the 1–9 scale; reciprocal entries are generated automatically.
- Eligibility requires at least two years of relevant experience, current or recent sector involvement, a decision-making or advisory role, adequate time, and no relevant project-level conflict.
- All eligible respondents complete the dimension matrix. Within-dimension modules are assigned automatically from the stakeholder pools specified in Paper Two.
- A ? control beside every dimension and subcriterion displays its Malawi-contextualised definition from Paper Two.

## Data protection

The site stores an unfinished draft in the respondent's browser. Submitted data is handled by Netlify Forms. Configure access, retention and deletion settings to match the approved research protocol and participant information sheet.
