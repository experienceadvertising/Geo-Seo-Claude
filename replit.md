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
- A GEO (Generative Engine Optimization) audit tool based on the geo-seo-claude GitHub repo
- Users enter any URL and get a full AI search optimization audit
- Features: GEO score (0-100), AI crawler access check, citability scoring, schema detection, platform readiness scores, quick wins
- AI-powered insights via Claude Haiku

### API Server (`artifacts/api-server`)
- Express 5 server at `/api`
- Routes: `POST /api/geo/analyze`, `GET /api/geo/audits`, `GET /api/geo/audits/:id`
- Core analysis in `src/lib/geoAnalyzer.ts` (self-contained, no external API keys needed)
- Uses Anthropic via `@workspace/integrations-anthropic-ai`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Codegen Note

After running codegen, the barrel file at `lib/api-zod/src/index.ts` is rewritten by the npm script to only export from `./generated/api` (to avoid duplicate export errors from split-mode zod generation).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
