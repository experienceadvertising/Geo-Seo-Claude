# September 2026 SEO and GEO strategy release

Status: in progress. Branch `codex/seo-geo-strategy-newsletter-2026-09-17` was created from `origin/main` at `6ad143a` so another working copy's unrelated edit stays untouched.

Deliverables:
- [x] Two original, attributed public guides with article markup, static article text, source links, and internal links. Build and live checks remain.
- [x] One concise strategy email template with named source links, a practical next action, Postmark unsubscribe placeholder, app-wide opt-out link, and required postal-address guard. Delivery remains.
- [ ] Verify newsletter audience and use a Postmark Broadcast stream, not the transactional stream.
- [ ] Run typecheck, production build, metadata checks, and preview.
- [ ] Publish the pages and verify live URLs.
- [ ] Send to eligible users once, then verify provider acceptance and report the honest result.

Research checked September 17, 2026: Cyrus Shepard's September 16 expert survey and August 13 Content Effort post, the August 4 SEO-for-AI-search article, and Google Search Central's AI features documentation. Survey responses are practitioner judgments, not confirmed ranking factors. Google says ordinary SEO practices remain relevant and that AI Overviews and AI Mode have no extra technical requirements beyond Search eligibility.

Important delivery finding: the current app sends weekly strategy mail through Postmark's `outbound` transactional stream. Postmark says a one-to-many newsletter belongs on a Broadcast stream. Do not reuse `outbound` for this campaign.

September 17 checks: root typecheck, 63 API tests, frontend tests, and the campaign template tests pass. The local Vite build was stopped after more than seven minutes of CPU-bound transforming and over 2 GB memory with no output; production build and static metadata validation remain release gates. Temporary platform-native test dependencies were removed from the manifest and lockfile. Postmark browser access requires Evan to sign in. A valid business postal address is required for the promotional newsletter; requested from Evan. Sign-up currently has no separate newsletter opt-in; audience permission basis was also requested. The one-time send script only selects verified, non-opted-out users, checks both guides are live, validates a Postmark-managed Broadcast stream, records per-user delivery claims, and will not retry an uncertain send automatically.
