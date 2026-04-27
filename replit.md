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

## Artifacts

### GEO SEO Analyzer (`artifacts/geo-seo-tool`)
- React + Vite web app at preview path `/`
- An AEO (Answer Engine Optimization) audit tool — branding: AEO Improvement
- Users enter any URL and get a full AI search optimization audit
- Features: AEO score (0-100), AI crawler access, citability scoring, schema detection, quick wins
- AI-powered insights via Claude; prompt simulation via GPT-4o-mini + ChatGPT/Claude/Gemini/Perplexity
- Tiered SaaS: Free / Pro ($79/mo) / Agency ($249/mo) via Clerk publicMetadata `plan` field
- Sentiment analysis: keyword-heuristic detection of Positive/Neutral/Negative brand tone per engine result
- Visibility Trend: line chart of historical AEO scores for a domain (`/api/geo/audits/history`)
- Fix Generator (Pro only): generates ready-to-copy llms.txt, JSON-LD schema, robots.txt snippets
- Plan hook: `src/hooks/usePlan.tsx` reads plan from `/api/me`, gates engine/prompt UI
- Upgrade CTA component: `src/components/upgrade-prompt.tsx`

### API Server (`artifacts/api-server`)
- Express 5 server at `/api`
- Routes: `POST /api/geo/analyze`, `GET /api/geo/audits`, `GET /api/geo/audits/:id`,
  `GET /api/geo/audits/history?domain=X`, `GET /api/geo/audits/:id/fixes` (Pro),
  `POST /api/geo/prompts/suggest`, `POST /api/geo/simulate`, `GET /api/geo/simulations/:id`,
  `GET /api/me` (returns user plan from Clerk)
- Stripe payment routes: `GET /api/stripe/products`, `GET /api/stripe/subscription`,
  `POST /api/stripe/checkout`, `POST /api/stripe/portal`, `POST /api/stripe/webhook`
- Plan system: `src/lib/planUtils.ts` — getUserPlan(), planAtLeast(), PLAN_LIMITS
- Stripe integration: `src/lib/stripeClient.ts` (Replit managed credentials), `src/lib/webhookHandlers.ts`
- Webhook must be registered BEFORE `express.json()` in `app.ts` (needs raw Buffer body)
- On checkout.session.completed webhook: updates Clerk `publicMetadata.plan` to "pro"/"agency"
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
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/scripts run seed-products` — create Pro/Agency Stripe products (idempotent)

## Codegen Note

After running codegen, the barrel file at `lib/api-zod/src/index.ts` is rewritten by the npm script to only export from `./generated/api` (to avoid duplicate export errors from split-mode zod generation).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
