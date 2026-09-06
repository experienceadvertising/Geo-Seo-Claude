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
- Real PostgreSQL integration passes using the unchanged production progress-handler source and auth middleware: unauthenticated rejection, save/read, trimmed notes, upsert, user/domain isolation, cross-user reopen isolation, reopening, invalid ID rejection, and weekly template rendering from persisted rows. Sessions are synthetic and the rate limiter is bypassed in this harness; this does not test login, rate limiting, the full scheduler or email delivery.
- `scripts/qa-progress-postgres.mjs` uses only an isolated local PostgreSQL server on 127.0.0.1:55439 with user `aeo_test`, database `postgres`, and a fresh empty schema. It does not read deployment credentials.
- Reproduce with Vite preview on 4173, `QA_AUDIT=1 QA_PAID=1 QA_PORT=4199 node scripts/qa-dashboard-preview.mjs`, then `node --experimental-strip-types scripts/qa-personalized-progress.mjs`. The browser test blocks non-loopback traffic.

## Release boundary

No merge, deployment, provider lookup, customer email, migration, credential or plan-limit change performed for this release. The existing cadence and opt-out rules remain unchanged. Completion records retain the existing user-and-domain scope. UI save/reopen is verified against local fixtures; actual progress handlers are separately verified with isolated PostgreSQL. Replit-specific deployment wiring, scheduler execution and delivery remain post-release verification items, not proven by these tests. Recommendation: ready for merge and deployment approval, followed by a controlled smoke check.
