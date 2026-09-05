export interface ImplementationGuide {
  sources: Array<{ title: string; url: string; reviewed: string }>;
  context?: string;
  owner: string;
  steps: string[];
  example: string;
  verify: string;
  measure: string;
}

const content: ImplementationGuide = {
  sources: [{ title: "Google Search Central: helpful, reliable content", url: "https://developers.google.com/search/docs/fundamentals/creating-helpful-content", reviewed: "2026-09-05" }],
  owner: "Content editor or business owner",
  steps: ["Open the audited page and locate the passage described in the finding.", "Replace general advice with a relevant example, documented observation, or source you can verify. Do not invent evidence.", "Review the edit for accuracy, publish it, then record the implementation date and note in your task."],
  example: "Instead of saying a service saves time, explain which step it removes and show a real, permissioned example. State the limits of that example.",
  verify: "Check the published URL, confirm the new information is visible, and re-audit the same page. Marking done records your work, not independent verification.",
  measure: "Compare later audit signals and, where connected and available, Search Console and selected keyword snapshots. Movement does not prove this edit caused it.",
};
const groups: Array<{ ids: string[]; guide: ImplementationGuide }> = [
  { ids: ["add-byline"], guide: { ...content,
    steps: ["Identify the actual author or reviewer and their relevant experience.", "Add an accurate byline linked to a useful biography or About page. Do not invent credentials.", "Explain how the material was prepared when that context helps readers judge it."],
    example: "A repair guide can identify the technician who reviewed the procedure and their relevant hands-on experience.",
    verify: "Check the published byline and biography links. An author label alone does not establish expertise or guarantee rankings.",
  }},
  { ids: ["content-effort-curation"], guide: { ...content,
    sources: [{ title: "Google Search Central: crawlable links", url: "https://developers.google.com/search/docs/crawling-indexing/links-crawlable", reviewed: "2026-09-05" }],
    steps: ["Organize the page around the reader's main task and remove repeated sections.", "Link to relevant supporting pages using descriptive link text, not a list of keywords.", "Use real links with destination URLs and check that each destination provides the promised detail."],
    example: "Link from a service overview to the relevant setup guide using 'installation requirements' instead of 'click here'.",
    verify: "Follow each link and inspect its anchor and href in rendered HTML. This page review does not establish whether other pages on the site are orphaned.",
  }},
  { ids: ["brand-facts", "brand-mention-early"], guide: { ...content,
    steps: ["Write down your actual product or service, audience, problem solved, and a defensible differentiator.", "Put those facts near the start of the relevant page. Align the homepage, About page, product pages and profiles you control.", "Ask someone unfamiliar with the company to explain what you do after reading it; revise anything they misunderstood."],
    example: "Illustrative only: A scheduling service for independent repair shops that helps customers book available appointments online. Add a differentiator only if you can support it.",
    verify: "Read the published pages side by side for conflicting descriptions, then re-audit and review relevant sampled buyer prompts.",
  }},
  { ids: ["question-headings", "add-faq", "direct-answer-block", "answer-capsules", "add-tldr-summary"], guide: { ...content,
    sources: [...content.sources, { title: "SearchPilot: ecommerce FAQ experiment (site-specific evidence)", url: "https://www.searchpilot.com/resources/case-studies/will-adding-faq-content-to-footer-copy-improve-organic-traffic", reviewed: "2026-09-05" }],
    context: "If this is a product category page, answer genuine buying questions such as compatibility, sizing or selection that the product grid leaves unanswered. Keep shopping controls usable. This example does not mean the audit identified your page as a category page. A reported ecommerce test supports trying relevant answers, not a universal FAQ formula or promised lift.",
    steps: ["Choose a real buyer question relevant to this page. Use customer questions or connected Search Console data where available.", "Add a descriptive heading and answer it directly, then include evidence, exceptions and useful detail.", "Keep related answers on the existing page. Create a separate page only when the intent requires a distinct, substantial answer."],
    example: "For a setup page, answer which inputs are needed and what happens if one is missing, rather than adding unrelated questions to increase word count.",
    verify: "Check that the answer makes sense without surrounding text and does not duplicate or contradict another page.",
  }},
  { ids: ["increase-depth", "content-effort-helpfulness", "trim-filler"], guide: { ...content,
    sources: [...content.sources, { title: "SearchPilot: listing content experiment (combined content and rendering change)", url: "https://www.searchpilot.com/resources/case-studies/how-does-ai-content-impact-listing-pages", reviewed: "2026-09-05" }],
    steps: ["Identify what a visitor still needs to choose or complete their task. Remove repetition before adding material.", "Add verified, page-specific details, examples and constraints. Review generated drafts for accuracy and originality.", "Check the published text and served HTML with your developer. Record content and rendering changes separately so later comparisons have context."],
    context: "For a listing page, useful additions might explain the available options, eligibility, location or selection criteria. This is conditional guidance, not an automatic page-type diagnosis. Avoid producing near-duplicate pages just to cover more keywords.",
    example: "A destination listing can explain verified transport options and seasonal constraints alongside the relevant listings. Do not pad it to a target word count.",
  }},
  { ids: ["content-effort-original-evidence", "content-effort-methodology", "content-effort-perspective", "add-proprietary-data", "add-statistics", "add-expert-quotes", "add-authoritative-citations"], guide: { ...content,
    steps: ["Identify the claim a reader needs to evaluate, not just a place to insert a statistic.", "Add a relevant source or a genuine first-party example, with scope, date, method and limitations. Obtain permission for customer material.", "Explain what the evidence supports and what it does not. Link to the original source and review any quotation for accuracy."],
    example: "A testing note can describe the actual inputs, comparison criteria and tradeoffs without claiming your small sample represents every customer.",
  }},
  { ids: ["freshness-signal", "explicit-date", "current-year-stats", "content-aging-12mo", "content-stale-24mo"], guide: { ...content,
    steps: ["Check dates, prices, instructions and sources for information that actually changed.", "Correct outdated details and explain material revisions. Keep historical evidence dated.", "Update the visible review date only after a real review, and keep structured dates consistent."],
    example: "Replace an obsolete setup instruction with the current verified process. Do not change only the year in the title.",
  }},
  { ids: ["article-schema", "faq-schema", "howto-schema", "org-schema"], guide: { ...content, owner: "Website administrator or developer",
    steps: ["Check existing markup from your CMS or plugin before adding another block.", "Review any generated draft against the visible page. Remove invented facts and use only a relevant schema type.", "Test in a preview, validate the markup, and publish through your normal release process."],
    example: "Organization markup should describe your actual business and verified profiles. A schema type does not guarantee a rich result or an AI citation.",
    verify: "Inspect published markup with a schema validator and check for conflicting duplicate entities. Confirm the visible page matches it.",
  }},
  { ids: ["unblock-crawlers", "nosnippet-directive", "review-data-nosnippet", "review-infrastructure-bot-controls", "server-render-ai-content"], guide: { ...content, owner: "Website administrator or developer",
    sources: [{ title: "Google Search Central: AI features", url: "https://developers.google.com/search/docs/appearance/ai-features", reviewed: "2026-09-05" }, { title: "OpenAI: crawler roles", url: "https://developers.openai.com/api/docs/bots", reviewed: "2026-09-05" }],
    steps: ["Confirm the intended publishing and crawler policy with the site owner before changing a control.", "Inspect the affected URL, raw HTML, relevant robot directives and infrastructure rules. Distinguish search access from model-training access.", "Test the smallest approved change on a preview and verify that private content and intentional restrictions remain protected."],
    example: "A deliberate snippet restriction may be correct. Review its purpose and platform-specific effect rather than removing it automatically.",
    verify: "Inspect the served HTML and response headers, then use the platform's inspection tools where available. Allowed access does not prove crawling, indexing or citation.",
  }},
];

/** Exact catalog IDs only. Unknown historical tasks receive a safe general workflow. */
export function getImplementationGuide(id?: string): ImplementationGuide {
  return groups.find(group => id && group.ids.includes(id))?.guide ?? content;
}
