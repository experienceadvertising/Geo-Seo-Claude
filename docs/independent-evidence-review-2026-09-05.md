# Independent SEO and GEO evidence review

Reviewed September 5, 2026. Targeted review of original publisher reports and a research preprint, not an exhaustive systematic review. Commercial tool vendors are independent of Zyppy, not free of commercial interests. Their datasets were not independently reproduced here.

## Decisions

### 1. Schema: useful implementation, not a citation promise

Source: Louise Linehan, Ahrefs, May 11, 2026, https://ahrefs.com/blog/schema-ai-citations/

Design: observational matched before/after study of 1,885 pages adding JSON-LD against control pages. The reported analysis found no clear citation uplift. Already-cited pages, pooled schema types, concurrent changes and a short observation window limit generalization.

Decision: retain accurate schema guidance, but do not increase GEO priority merely because markup is absent. Existing implementation copy already avoids citation guarantees. Review catalog claims and priority separately before changing scoring. Do not advise removing useful markup based on this study.

### 2. Freshness: fix obsolete information, not just dates

Source: Ryan Law, Ahrefs, July 28, 2025, https://ahrefs.com/blog/do-ai-assistants-prefer-to-cite-fresh-content/

Design: observational comparison of cited-page age across platforms using crawler and publishing-date proxies. Platform differences are not evidence that changing a date causes visibility gains.

Decision: existing freshness workflow appropriately requires substantive review. Further detector work should distinguish a missing date from demonstrably obsolete information. Evergreen pages should not be declared poor solely because they are old.

### 3. Category questions: add relevant buying help

Source: Nuha Miah, SearchPilot, April 24, 2026, https://www.searchpilot.com/resources/case-studies/will-adding-faq-content-to-footer-copy-improve-organic-traffic

Design: reported controlled ecommerce listing-page test adding category-specific questions while keeping other page elements unchanged. Positive organic-click result in that setting. Public report lacks enough raw data for independent reproduction.

Decision: a useful contextual extension to the existing FAQ workflow. For category pages, answer actual compatibility, selection, sizing or use-case questions not addressed by the product grid. Keep helpful answers visible. Do not prescribe FAQs on every page, a fixed number of questions, footer placement everywhere, or FAQ schema as the cause. Test on a small set of relevant pages before wider rollout.

### 4. Thin listing pages: content and rendering are separate checks

Source: Rida Abidi, SearchPilot, June 26, 2026, https://www.searchpilot.com/resources/case-studies/how-does-ai-content-impact-listing-pages

Design: travel listing-page test adding descriptive content and serving it in initial HTML. Both content and rendering changed, so the result cannot identify AI authorship or server rendering as the sole cause.

Decision: extend implementation examples for thin listing pages with verified, page-specific details. Check served HTML separately. Do not recommend mass generation of near-duplicate location pages. Existing content-depth and server-rendering tasks cover the foundations; a reliable page-type detector is needed before automated listing-specific recommendations.

### 5. Internal linking: evaluate both sides of the change

Source: Demetria Spinrad, SearchPilot, December 12, 2024, https://www.searchpilot.com/resources/case-studies/expanding-your-internal-linking-test-strategy

This recent synthesis links to older experiments, including a June 2021 related-article test: https://www.searchpilot.com/resources/case-studies/seo-split-test-lessons-increasing-related-article-links

The older test measured donor, recipient and combined traffic separately and reported different confidence levels. It is historical supporting evidence, not a new 2024 experiment.

Decision: contextual links remain sensible. For implementation tracking, record both the page receiving a new link and the page supplying it. Do not infer an ideal link count or promise transferable uplift. Current single-page audit cannot certify sitewide internal-link coverage.

### 6. Citations versus answer support: research candidate

Source: Zhang Kai and coauthors, April 2026 preprint, https://arxiv.org/html/2604.25707v2

Reviewed framework, practical implications and validity sections. The descriptive study distinguishes appearing in citations from contributing supporting information. Its influence measure is a proxy, not model attention or causal attribution. Designed prompts, missing aligned timestamps and uncompleted confirmatory analyses limit generalization. Peer review was not established.

Decision: keep as an experimental measurement candidate, not a new production score. A future manual rubric could distinguish brand mention, linked citation, answer support and factual accuracy while preserving prompt, platform and run date. Validate agreement between human reviewers before automating. Do not interpret simulated responses as verified live search citations.

## Implementation order

1. Add category-page and listing-page examples to existing guidance, shown conditionally only when page type is known. Preserve shared app/email instructions and source attribution.
2. Audit recommendation priorities for schema and age-only freshness findings. Changes require fixtures and compatibility checks, not a silent scoring adjustment.
3. Expand internal-link action records to include donor and recipient URLs, then compare observed outcomes without claiming causation.
4. Prototype answer-support evaluation offline with human review before adding a customer-facing metric.

## Not justified by this review

Guaranteed citation lifts, a universal FAQ recipe, mandatory frequent date changes, a fixed link count, mass AI content generation, and translating correlations into ranking weights.

The initial review made no app changes. In the subsequent implementation, category and listing examples were added conditionally to shared app and email guidance, without inventing page-type detection. Schema, authorship and snippet-control wording was corrected. Scoring and external integrations were not changed.

## Final gap check

Ahrefs' December 12, 2025 brand-visibility correlation study was also reviewed: https://ahrefs.com/blog/ai-brand-visibility-correlations/. Its sample favored established domains and its associations do not establish causal effects of video production, paid publicity or advertising. Existing brand-facts guidance remains appropriate. No automatic recommendation to buy mentions, spend on ads, or produce videos solely for citation lift was added.

This review does not establish that no other useful technique exists. Deferred capabilities include validated site-type detection, sitewide link analysis, controlled experiment design and answer-support evaluation. These need product and measurement work rather than importing a study's headline as a scoring rule.
