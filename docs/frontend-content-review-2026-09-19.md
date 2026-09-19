# Front-end content review, September 19, 2026

## Scope

Reviewed the 35 page modules under `artifacts/geo-seo-tool/src/pages`, their routed variants, the shared guide sources, rotating dashboard tips, comparison data, and the main product claims in front-end components. Public routes, account entry pages, and signed-in audit and prompt-test copy were included. Legal and privacy pages were checked for conflicting product claims but not rewritten as a legal review.

## Source of truth

- Trial and plan limits: `artifacts/api-server/src/lib/planUtils.ts` and the live pricing flow.
- Fix Generator output: `artifacts/api-server/src/routes/geo/index.ts` and the audit result disclosure. Organization and WebSite drafts are generated; FAQPage and breadcrumb drafts are not automatic.
- Google AI Search eligibility: https://developers.google.com/search/docs/appearance/ai-features
- Google-Extended role: https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
- OpenAI crawler roles: https://developers.openai.com/api/docs/bots
- Anthropic crawler roles: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- Competitor pricing: https://otterly.ai/pricing, https://athenahq.ai/plans, https://www.tryprofound.com/pricing, https://www.brandlight.ai/

## Findings and changes

1. The homepage buried the trial, free plan, and $29 Starter price. The hero and value section now explain the workflow, starting price, and ongoing releases.
2. Older guides and dashboard tips confused training bots with search crawlers, treated Google-Extended as an AI Overviews crawler, prescribed FAQ markup and answer length as citation tactics, and promised timelines or lift. These claims were corrected across the three main guides and dashboard learning copy.
3. About and comparison pages described FAQPage generation as automatic and suggested code could be pasted without review. Copy now reflects draft Organization and WebSite schema plus reviewable crawler guidance.
4. Competitor comparisons contained prices and availability claims that had changed. Current public vendor pages were checked, outdated claims corrected, and uncertain table entries changed to prompts for a current vendor check.
5. Pricing, upgrade, product landing, and solution landing copy now connect the trial, free plan, paid value, and continuing improvements without promising rankings or citations.
6. The benchmark and signed-in results now say plainly that readiness scores are internal diagnostic summaries, not provider ranking weights or citation probabilities.

## Verification boundary

Static content and routed page copy were reviewed in code. Typecheck, build, public SEO validation, release checks, and rendered browser checks must pass before this review is considered released. A signed-in production audit needs an existing account session; the public browser session redirected to the homepage.
