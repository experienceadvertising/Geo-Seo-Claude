# Zyppy AI Search Framework Integration

**Reviewed:** August 4, 2026
**Primary source:** [These SEO Strategies Drive 90% of Your AI Visibility](https://signal.zyppy.com/p/seo-strategies-for-ai-search), Cyrus Shepard, Zyppy Signal

## Product interpretation

The article's core idea is that most AI visibility work should build on good SEO instead of becoming a separate checklist of speculative GEO tactics. AEO Improvement should organize its analysis around three user goals.

### 1. Make content eligible

Check whether search and AI systems can access, understand, and quote the page.

- Separate search, user-fetch, and training crawler roles.
- Compare raw HTML with rendered content.
- Review CDN and bot-management rules in addition to robots.txt.
- Check `noindex`, `nosnippet`, `max-snippet`, and section-level `data-nosnippet` controls.
- Treat crawler access as a policy choice. Do not tell every publisher to allow every training bot.
- Treat `llms.txt` as optional and unproven. It should not affect the score.

### 2. Improve citation opportunity

Traditional search visibility remains an important input. The tool should not imply that formatting alone can compensate for weak rankings or irrelevant content.

- Start with a query the page already ranks for.
- Generate tightly related fan-out queries across primary intent, supporting topics, comparisons, problems, use cases, and decision-stage research.
- Compare the existing page against that cluster.
- Improve the existing page when the missing topic fits its main intent.
- Recommend a new page only when the missing topic represents a distinct user need.
- Favor specific claims, first-party information, cited evidence, and headings that match the question being answered.
- Avoid generic FAQ expansion and thin pages created for every query variation.

### 3. Improve recommendation signals

AI recommendations are influenced by what a company says about itself and by consistent support from credible third parties.

- Define a clear brand fact pattern: product, audience, use case, and differentiator.
- Check whether those facts are consistent across owned pages and profiles.
- Look for authentic mentions on relevant third-party sites.
- Encourage detailed customer reviews that describe the problem and outcome.
- Prioritize credible digital PR and topic relevance over keyword-rich anchor text.
- Treat Reddit, LinkedIn, directories, marketplaces, app stores, and review platforms as possible evidence sources, not guaranteed ranking levers.

## Changes included in this branch

- Removed the `llms.txt` scoring bonus and stopped recommending it by default.
- Added detection and a recommendation for substantive content hidden by `data-nosnippet`.
- Reworked question and FAQ recommendations around relevant fan-out coverage.
- Updated fan-out prompt generation to produce a balanced, tightly related query cluster.
- Added user guidance to improve an existing ranking page before creating more URLs.
- Updated the recommendation catalog sources and methodology version.
- Added a read-only Search Console opportunity layer that anchors fan-out generation in queries the audited page already ranks for.

## Next product work

### Search Console content-gap layer

The first Search Console layer and a lexical coverage preview are now implemented. The remaining work is deeper semantic assessment and persistence.

1. Compare the cluster with the complete current page, not only stored headings and previews.
2. Recommend `add to this page` or `consider a separate page` based on intent fit.
3. Save the selected seed query and gap assessment with the audit.
4. Recheck rankings, citations, and AI visibility after the change.

### Brand consensus layer

The current brand-authority check is useful but narrow. Expand it carefully.

- Capture the brand's preferred fact pattern with user confirmation.
- Compare owned-site descriptions and connected profiles for consistency.
- Report verified third-party mentions by source type and topical relevance.
- Separate `not found` from `source unavailable` so missing data never becomes a negative score.
- Do not manufacture review, PR, or authority recommendations when the tool has no evidence.

## Guardrails

- AI citations are probabilistic and volatile.
- Correlation should not be presented as causation.
- A source synthesis is not the same as a controlled experiment.
- Recommendations must say what the audit observed and what it inferred.
- The tool should not guarantee rankings, citations, traffic, or revenue.
