# September 2026 SEO and GEO strategy release

Status: guides published; newsletter production delivery in progress. PR 69 merged as `658040e`, then Replit workspace merged the release while preserving its own 43 existing commits. The original branch was created separately so another working copy's unrelated edit stays untouched.

Deliverables:
- [x] Two original, attributed public guides with article markup, static article text, source links, and internal links. Both pages are live.
- [x] One concise strategy email template with named source links, a practical next action, Postmark unsubscribe placeholder, app-wide opt-out link, and required postal-address guard. Delivery remains.
- [x] Verify a Postmark-managed Broadcast stream. The production audience has 21 users, 17 meeting verified/non-opted-out eligibility; permission basis still needs confirmation.
- [x] Run typecheck, production build, frontend/API/template tests, and generated-page metadata checks in GitHub Actions. Live-page check remains.
- [x] Publish the pages and verify live URLs, canonical metadata, source links, and structured data.
- [ ] Send to eligible users once, then verify provider acceptance and report the honest result.

Research checked September 17, 2026: Cyrus Shepard's September 16 expert survey and August 13 Content Effort post, the August 4 SEO-for-AI-search article, and Google Search Central's AI features documentation. Survey responses are practitioner judgments, not confirmed ranking factors. Google says ordinary SEO practices remain relevant and that AI Overviews and AI Mode have no extra technical requirements beyond Search eligibility.

Important delivery finding: the current app sends weekly strategy mail through Postmark's `outbound` transactional stream. Postmark says a one-to-many newsletter belongs on a Broadcast stream. Do not reuse `outbound` for this campaign.

September 17 checks: root typecheck, 63 API tests, frontend tests, and campaign template tests pass. The local Vite build was stopped after more than seven minutes of CPU-bound transforming and over 2 GB memory with no output, but the Linux CI production build and public SEO validation passed. Temporary platform-native test dependencies were removed from the manifest and lockfile. Postmark browser access requires Evan to sign in. Sign-up currently has no separate newsletter opt-in; audience permission basis was requested. The one-time send script only selects verified, non-opted-out users, checks both guides are live, validates a Postmark-managed Broadcast stream, records per-user delivery claims, and will not retry an uncertain send automatically.

GitHub Actions run `35289238218` passed on Linux, including production Vite build and public SEO route validation. Evan supplied a mailing address for the promotional footer; keep it in deployment configuration rather than source control. Postmark login and audience-permission confirmation are still pending.

September 18 UTC: Replit deployment `526e2fb4-ec1d-4097-a1fe-113fbbf7b8f3` succeeded. Both new URLs returned their unique title, canonical, structured data, and source credit. The Broadcast stream is active with managed unsubscribe. Replit Shell uses development Postgres `heliumdb` with 6 users; live production uses separate `neondb` with 21 users. No email was sent, including test sends, because the tested owner addresses were not eligible in the development DB. Do not run the CLI against the Shell database for this campaign. Branch `codex/production-newsletter-2026-09-17` is adding a guarded, admin-only production send path and a stronger branded email. A local browser preview confirmed the updated email layout. Audience-permission confirmation remains pending.
