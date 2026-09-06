# Personalized progress release

## Changes

- Simulation follow-up selects an unfinished catalog-backed finding from the linked, owned audit. It includes the saved page, collection date, detected issue, implementation guide and a direct task link.
- Missing audit context and completed checklists have explicit fallbacks. Optional off-site guidance is not represented as a detected defect.
- Action plan adds three optional off-site work records with notes, completion and reopening. Selected on-site tasks accept implementation notes.
- Weekly email includes up to ten recent site-wide self-reported work records, the next unfinished task, and comparisons between recent successful numeric rank snapshots and their previous successful observations.
- Ranking comparisons exclude missing, stale, future and invalid results and do not claim causation.

## Validation

- 50 API tests pass, including selection, completion exclusion, personalization, escaping and rank comparison fixtures.
- 37 frontend tests pass.
- Root typecheck and production build pass.
- Public SEO validation passes for 30 routes.
- Synthetic personalized email preview inspected in browser. No email was sent.
- Local headless Chrome end-to-end test passes: off-site completion, note retention after reload, reopening, completed-task exclusion, weekly email generated from saved fixture records, on-site implementation note, and 390px viewport width.
- Reproduce with Vite preview on 4173, `QA_AUDIT=1 QA_PAID=1 QA_PORT=4199 node scripts/qa-dashboard-preview.mjs`, then `node --experimental-strip-types scripts/qa-personalized-progress.mjs`. The browser test blocks non-loopback traffic.

## Release boundary

No merge, deployment, provider lookup, customer email, migration, credential or plan-limit change performed for this release. The existing cadence and opt-out rules remain unchanged. Completion records retain the existing user-and-domain scope. UI save/reopen is verified against local fixtures, not the real API or database. Runtime database integration still needs verification in staging before publishing.
