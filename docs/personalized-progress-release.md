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

## Release boundary

No merge, deployment, provider lookup, customer email, migration, credential or plan-limit change performed for this release. The existing cadence and opt-out rules remain unchanged. Completion records retain the existing user-and-domain scope. Runtime database and full off-site UI save/reopen testing are still needed in staging before publishing.
