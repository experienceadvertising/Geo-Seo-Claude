# SEO keyword insights and workspace organization

## Delivered

- `/seo/:id?`: Search Console performance, existing controlled rank tracking, keyword demand, intent, monthly demand history, and captured search competitors.
- `/actions/:id?`: existing task completion and implementation guides without the rest of the audit report.
- `/ai-visibility/:id?`: prompt-testing guidance and a link to the selected audit's simulator and saved results.
- All three use authenticated routes and preserve page selection when switching sections. Old result URLs and hashes remain supported. Mobile uses four primary destinations and an account menu.
- Recommended tools expansion is included in the preceding commit on this branch.

## Provider and cost controls

Keyword Overview uses `/v3/dataforseo_labs/google/keyword_overview/live`, which returns volume, monthly searches, and intent together. No clickstream or SERP enrichment options are enabled. No extra keyword/intent request runs during page loads, rank refreshes, or scheduled collection.

Users explicitly request batches for active targets on the displayed site. Requests are grouped by location and language, deduplicating keyword text within each group, with at most four provider calls per HTTP request. Cached insights remain valid for 30 days. Intent and demand are market estimates for the target's location/language, not device-specific traffic measurements. Provider update dates are displayed separately from collection dates.

Pro: 25 target lookups per calendar month. Agency: 100. These limits apply across the entire account, independent of existing per-domain rank target limits. A transaction-scoped account/month advisory lock and persistent unique target/month reservations prevent concurrent clicks from bypassing the budget. A failed, missing, or uncertain response keeps the reservation and prior data. No silent retries. This is conservative because the provider may have charged for an uncertain request.

Published Labs pricing checked September 5, 2026: $0.012 per task plus $0.00012 per item. One same-location batch of 25 costs approximately $0.015; 100 costs approximately $0.024. Worst case with a separate one-item call for every allowed target is approximately $0.303 per Pro account or $1.212 per Agency account per month, excluding existing rank tracking, hosting, taxes, or future provider price changes. No live paid calls were made during implementation.

Pricing: https://dataforseo.com/pricing/dataforseo-labs/dataforseo-google-api
Contract: https://docs.dataforseo.com/v3/dataforseo_labs/google/keyword_overview/live/

Search competitor context retains up to five safe, distinct organic domains ahead of the tracked result from the existing rank response. If the tracked domain was not found, it shows leading results instead. It does not purchase additional SERPs or backfill historical rows. Existing result depth and refresh quotas are unchanged.

## Storage and rollout

Additive startup migrations add nullable `seo_keyword_targets.insights`, nullable `seo_rank_snapshots.competitors`, and the `seo_insight_usage` reservation table. Deploy API and frontend together after migrations succeed. Historical rows display unavailable context until the next successful collection. Do not run schema push-force.

No billing, OAuth scopes, secrets, customer emails, or paid-plan prices are changed. Related keyword discovery and backlink research are not part of this release.

## Checks

- Root production build and typecheck.
- API parser/cache/budget tests and frontend shell/selection regression tests.
- `scripts/test-seo-insights.mjs`: real router and disposable local PostgreSQL on port 15497, mocked provider, no real API credentials. Run only on a fresh disposable database. Tests free-plan rejection, tenant isolation, caps across domains, concurrency, cache, missing provider configuration, and uncertain-response retry suppression.
- Local browser checks of paid/free SEO sections, action plan, AI visibility navigation, and historical snapshots.
