# Observed AI shopping performance and synthetic tests

Reviewed September 17, 2026. Scope: simulator guidance and manual prompt drafting, public methodology and crawlable content, recommended tools, simulation follow-up emails. No new API connection, OAuth scope, provider cost, scoring change or customer send.

Sources:
- https://support.google.com/merchants/answer/17200695?hl=en
- https://blog.google/products-and-platforms/products/shopping/google-shopping-updates-holiday-shopping/ (September 16, 2026 availability announcement)

The current help document governs report scope. Do not expand it to every Gemini, OpenAI or Alexa interaction based on an earlier announcement. Do not call aggregate terms verbatim customer conversations. Synthetic questions remain synthetic even when based on observed inputs.

Manual workflow: inspect a relevant report observation, check the matching page and product data, draft questions locally, review the questions, run within existing allowance, implement only supported changes, and compare like-for-like report filters later. Merchant Center import is not implemented or advertised. Missing access or data is not zero performance.

Acceptance checks: no added provider request from question drafting; preserve existing prompts and cap additions; HTML and plain-text email guidance agree; source attribution and scope warnings render in public static HTML as well as React; tests, typecheck and production build pass. Release and live verification must be recorded separately.

## Verification

- 45 frontend tests and 64 API tests passed.
- Workspace typecheck and full production build passed.
- Public SEO validator passed for 30 routes, including measurement content and attribution in initial HTML.
- Built methodology rendered in the browser and the retailer disclosure expanded correctly. An isolated static preview with explicit HTML content type and unauthenticated API responses was used because the standard Vite preview did not provide a usable direct page load.
- Prompt helper tests cover blank inputs, three-question generation, whitespace normalization, deduplication, existing-question preservation and plan caps. Authenticated simulator interaction was not run against production, and no paid provider call was made.
- Prepared on codex/merchant-ai-evidence. Not merged or published. No live-site or delivered-email claims are made for this change.
