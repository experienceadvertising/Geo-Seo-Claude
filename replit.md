# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Anthropic Claude (via Replit AI Integrations)
- **Web scraping**: Cheerio

## Authentication

Custom email+password auth (Clerk was removed — email delivery was unreliable and domain conflicts blocked production).

- **Session**: `express-session` + `connect-pg-simple` (sessions stored in PostgreSQL `sessions` table)
- **Passwords**: `bcryptjs` (12 rounds)
- **Email verification**: 24h token links sent via Postmark
- **Password reset**: 1h token links sent via Postmark
- **Cookie**: `aeo.sid`, httpOnly, sameSite=lax, 30-day maxAge
- **Session data**: `{ userId: string, email: string }`
- **Frontend**: `AuthContext` at `artifacts/geo-seo-tool/src/context/AuthContext.tsx`
- **Auth routes**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`,
  `GET /api/auth/verify-email?token=`, `POST /api/auth/resend-verification`,
  `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `GET /api/auth/me`
- **Session middleware**: `artifacts/api-server/src/middlewares/session.ts`
- **Admin check**: `req.session.email` compared to `ADMIN_EMAILS` env var (comma-separated)
- **Plan**: stored in `users.plan` column (updated by Stripe webhooks). Every account's FIRST MONTH
  is free with all features: `users.trial_ends_at` (signup + 30d; NULL ⇒ derived `created_at` + 30d)
  bumps the EFFECTIVE plan to agency-level entitlements via `planUtils.getPlanInfo()` while
  `users.plan` stays what they pay for. Gates use `getUserPlan()` (effective); billing UI and
  upsell emails use `getStoredPlan()`.

## Artifacts

### GEO SEO Analyzer (`artifacts/geo-seo-tool`)
- React + Vite web app at preview path `/`
- An AEO (Answer Engine Optimization) audit tool — branding: AEO Improvement
- Users enter any URL and get a full AI search optimization audit
- Features: AEO score (0-100), AI crawler access, citability scoring, schema detection, quick wins
- AI-powered insights via Claude; prompt simulation via GPT-4o-mini + ChatGPT/Claude/Gemini/Perplexity
- Tiered SaaS: Free / Pro ($79/mo, $790/yr) / Agency ($249/mo, $2,490/yr) via `users.plan` DB column;
  first month free with every feature unlocked (no card) — see Plan note in Auth section
- Sentiment analysis: keyword-heuristic detection of Positive/Neutral/Negative brand tone per engine result
- Visibility Trend: line chart of historical AEO scores for a domain (`/api/geo/audits/history`)
- Fix Generator (Pro only): generates ready-to-copy llms.txt, JSON-LD schema, robots.txt snippets
- Plan hook: `src/hooks/usePlan.tsx` reads plan from `/api/me`, gates engine/prompt UI
- Upgrade CTA component: `src/components/upgrade-prompt.tsx`
- Auth pages: `/sign-in`, `/sign-up`, `/verify-email`, `/forgot-password`, `/reset-password`

### API Server (`artifacts/api-server`)
- Express 5 server at `/api`
- Routes: `POST /api/geo/analyze`, `GET /api/geo/audits`, `GET /api/geo/audits/:id`,
  `GET /api/geo/audits/history?domain=X`, `GET /api/geo/audits/:id/fixes` (Pro),
  `POST /api/geo/prompts/suggest`, `POST /api/geo/simulate`, `GET /api/geo/simulations/:id`,
  `GET /api/me` (returns user plan from DB)
- Stripe payment routes: `GET /api/stripe/products`, `GET /api/stripe/subscription`,
  `POST /api/stripe/checkout`, `POST /api/stripe/portal`, `POST /api/stripe/webhook`
- Plan system: `src/lib/planUtils.ts` — getPlanInfo() (stored vs effective + trial), getUserPlan()
  (effective, trial-aware), getStoredPlan() (billing), planAtLeast(), PLAN_LIMITS, TRIAL_LENGTH_DAYS
- Trial lifecycle emails: daily cron 10:00 UTC in `src/lib/emailScheduler.ts` — reminder at ≤3 days
  left (`trial_reminder_sent_at`), ended notice within 7 days after lapse (`trial_ended_sent_at`)
- Stripe integration: `src/lib/stripeClient.ts` (Replit managed credentials), `src/lib/webhookHandlers.ts`
- Webhook must be registered BEFORE `express.json()` in `app.ts` (needs raw Buffer body)
- On checkout.session.completed webhook: updates `users.plan` in DB to "pro"/"agency"
- On subscription.deleted webhook: resets plan to "free"
- Products seeded via `pnpm --filter @workspace/scripts run seed-products`
- Core analysis in `src/lib/geoAnalyzer.ts` (self-contained, no external API keys needed)
- Recommendation engine in `src/lib/geoRecommendations.ts` — research basis: Princeton/IIT
  Delhi KDD 2024 + arXiv 2509.08919 (Sept 2025) + 2026 practitioner consensus
  (Semrush, HubSpot, Search Engine Land). Notable 2026 shifts: freshness 3.2x lift
  within 12 months, answer capsules (40-60 word block after H2), FAQ schema as highest-ROI
  structured data, llms.txt downgraded to optional, named-author byline upgraded to required,
  comparison tables for agentic search, current-year statistics required.
- Research summary at `.local/geo-research-2026.md`; refresh script `research-geo.mjs`
  (run quarterly to update findings).
- Uses Anthropic via `@workspace/integrations-anthropic-ai`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/db run push-force` — force push schema (runs `drizzle-kit push --force`)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/scripts run seed-products` — create Pro/Agency Stripe products (idempotent)

## SEO Comparison Pages

Public, indexable comparison pages live at:
- `/vs/:slug` — parameterized (otterly, athenahq, profound, brandlight). Page reads from `artifacts/geo-seo-tool/src/data/competitors.ts`. To add a competitor: append a new entry to `COMPETITORS` array + add corresponding entries to each row in `SHARED_ROWS` + add to sitemap.xml.
- `/best-aeo-tools` and `/best-geo-optimization-tools` — twin listicle pages (same component, `variant` prop swaps copy). Twin SEO pages with distinct canonicals.

Per-page meta tags via `react-helmet-async` (`HelmetProvider` wraps app in `App.tsx`); `<SEO>` wrapper component in `components/seo.tsx` handles title/description/canonical/OG/Twitter/JSON-LD.

JSON-LD blocks emitted: FAQPage + BreadcrumbList on /vs/* pages; ItemList + Article on listicles. Schema.org compliant.

**Standing rule**: never invent quantitative claims about competitors. All competitor facts in `competitors.ts` are sourced from their public marketing sites. Use "Not advertised" hedge when feature presence is unverifiable.

## Authority Signals Card

`components/authority-signals-card.tsx` — recommends Linkby (paid editorial), Connectively/HARO, Featured.com, PodMatch, Wikipedia, Reddit, YouTube as third-party citation channels that boost AEO. Lives in `DashboardLearningHub` on the home page. No affiliate links — pure recommendations with disclosure.

## Prompt Simulation

- Default auto-generated prompts: 6 (was 8) — 25% fewer queries per simulation, ~6×4=24 queries default. Prompt length constrained to 8–15 words for natural user-style queries.
- Gemini grounding URLs (vertexaisearch redirects) are resolved to final destinations via HEAD with redirect-follow before citation matching, so stripe.com appears as stripe.com instead of vertexaisearch.cloud.google.com.
- UI: Avg position relabeled "Avg depth" (was "33% in"). Citation Gap shows "insufficient data" when both you and a competitor have 0 citations (was nonsensical "0% behind"). Domain field is read-only with explicit placeholder.
- Fix Generator panel auto-scrolls into view on open (was rendering below the fold causing apparent "did nothing" UX).

## Admin Notifications + Contact Form

- `EmailService.sendAdminNotification(subject, lines[])` fans an operational email out to every address in `ADMIN_EMAILS`. No unsubscribe link (operational, not marketing). Failures logged, never bubble.
- Triggered from:
  - `/auth/register` after successful insert → `[Signup]` email.
  - `webhookHandlers.checkout.session.completed` after plan resolves → `[Upgrade]` email (with amount + currency). One-time per checkout via existing `claimEvent` idempotency.
  - `webhookHandlers.customer.subscription.deleted` when previous plan != free → `[Cancel]` email (with cancellation reason if Stripe provided one).
- Contact form: `POST /api/contact` (unauthenticated, IP rate-limited 5/hr, honeypot `website` field). Forwards to ADMIN_EMAILS via `EmailService.sendContactForm` with `ReplyTo` set to sender so admins can reply directly. Includes user id + plan if signed in.
- Page at `/contact`; linked from header nav (signed-in users) and footer (everyone).

## Codegen Note

After running codegen, the barrel file at `lib/api-zod/src/index.ts` is rewritten by the npm script to only export from `./generated/api` (to avoid duplicate export errors from split-mode zod generation).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
