# Guided improvement journey

## Implemented in the current PR

1. Dashboard and sidebar select an unfinished recommendation by priority. Loading, errors, missing recommendations and confirmed completion have different states. Google setup does not block acting on audit recommendations.
2. Task-specific links open a focused implementation panel, with instructions to edit, publish, record completion, re-audit and review measurement. Historical audits and unavailable progress cannot be marked complete. Completion dates are explicitly self-reported.
3. Paid keyword setup starts with the actual audited URL, exposes location/device options, and explains baseline collection after saving. No new requests or limits were added.
4. Audit trends compare only the same URL. Previously prepared rank freshness, baseline and Search Console comparisons remain in PR 46.
5. Weekly email task links open the same selected recommendation. Current-list completion counts no longer include unrelated recommendation IDs. Critical tasks sort ahead of high tasks.
6. Homepage explains the finding, change and measurement workflow with a labeled illustrative example, not an invented customer result.

## Validation

- 27 frontend regression tests and 33 API regressions passed, including loading/error/empty/completed distinctions and escaped task links in email HTML and text.
- Workspace typecheck and production build passed with the mockup package's required local PORT and BASE_PATH settings.
- Isolated browser fixture: dashboard task link opens the selected recommendation, country/device/page fields are visible, marking done updates the date, and returning to dashboard shows recorded tasks complete. Completion only updates local in-memory fixtures.
- Search Console failure remains a labeled failure in the fixture, not fabricated zero metrics.
- No live audit, DataForSEO collection, email delivery, account change, merge, migration or production deployment performed.

## Remaining release and follow-on work

- Verify an always-on or durable scheduler before promising unattended weekly collection. Current in-process scheduling depends on the API process remaining awake.
- Run the live paid-account journey after approved deployment, including one explicitly approved provider request and a real same-page re-audit. Local fixture completion is not live end-to-end validation.
- Progress storage remains user/domain/recommendation scoped. Page-specific completion and implementation notes need a migration and historical compatibility design before expansion across agency client pages.
- CMS-specific instructions and generated fix quality need separate validation. The new panel provides the current recommendation and publishing checklist, not automatic site edits.
- DataForSEO volume, intent, competition and cost/caching evaluation remains unimplemented; no enrichment spend authorized or incurred.
- Verified public case studies require permission and actual outcomes. The homepage example deliberately makes no customer-results claim.
- Google sensitive-scope verification still requires the Loom demo; do not advertise removal of the 100-user limit until Google confirms it.
