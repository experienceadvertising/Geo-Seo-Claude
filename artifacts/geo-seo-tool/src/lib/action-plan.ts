type RecommendationCategory =
  | "answerability"
  | "authority"
  | "structure"
  | "depth"
  | "freshness"
  | "technical"
  | "entity";

type RecommendationForRewrite = {
  id?: string;
  category: RecommendationCategory;
};

type AuditForRewrite = {
  url: string;
  title?: string | null;
  description?: string | null;
  brandName?: string | null;
};

export type SiteRewriteSuggestion = {
  label: string;
  draft: string;
  groundedIn: string[];
  reviewNote: string;
};

const SITE_CONTROL_IDS = new Set([
  "llms-txt",
  "unblock-crawlers",
  "org-schema",
  "review-infrastructure-bot-controls",
]);

const GEO_ONLY_IDS = new Set([
  "llms-txt",
  "unblock-crawlers",
  "nosnippet-directive",
  "review-data-nosnippet",
  "server-render-ai-content",
  "review-infrastructure-bot-controls",
]);

export function recommendationScope(id?: string): "Audited page" | "Site control" {
  return id && SITE_CONTROL_IDS.has(id) ? "Site control" : "Audited page";
}

export function recommendationChannels(
  category: RecommendationCategory,
  id?: string,
): Array<"SEO" | "GEO"> {
  if (id && GEO_ONLY_IDS.has(id)) return ["GEO"];
  if (category === "technical" && id === "article-schema") return ["SEO", "GEO"];
  return ["SEO", "GEO"];
}

export function friendlyRecommendationCategory(category: RecommendationCategory): string {
  return ({
    answerability: "Direct answers",
    authority: "Evidence and authority",
    structure: "Content structure",
    depth: "Content quality",
    freshness: "Freshness",
    technical: "Technical access",
    entity: "Brand clarity",
  } satisfies Record<RecommendationCategory, string>)[category];
}

export function normalizedAuditPage(url: string): string | null {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.search = "";
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return null;
  }
}

export function uniqueAuditedPageCount(urls: string[], domain: string): number {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");
  return new Set(urls.map(normalizedAuditPage).filter((page): page is string => Boolean(page?.startsWith(`${normalizedDomain}/`)))).size;
}

function cleanText(value?: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function pageTopic(audit: AuditForRewrite): string {
  const title = cleanText(audit.title).split(/[|\-–—]/)[0].trim();
  if (title) return title;
  try {
    const path = new URL(audit.url).pathname.replace(/^\/+|\/+$/g, "");
    if (path) return path.split("/").pop()!.replace(/[-_]+/g, " ");
    return new URL(audit.url).hostname.replace(/^www\./, "");
  } catch {
    return "this topic";
  }
}

/**
 * Creates an editable starting point from copy already saved in the audit.
 * Bracketed fields are intentional: the scanner must never invent audiences,
 * proof, statistics, or differentiators that the page did not establish.
 */
export function siteRewriteSuggestion(
  recommendation: RecommendationForRewrite,
  audit: AuditForRewrite,
): SiteRewriteSuggestion | null {
  if (recommendation.category === "technical") return null;

  const id = recommendation.id ?? "";
  const brand = cleanText(audit.brandName) || pageTopic(audit);
  const topic = pageTopic(audit);
  const description = cleanText(audit.description);
  const groundedIn = [
    cleanText(audit.title) ? "page title" : null,
    description ? "meta description" : null,
    cleanText(audit.brandName) ? "detected brand" : null,
  ].filter((item): item is string => Boolean(item));
  const reviewNote = "This is an editable starting point, not publish-ready copy. Replace every bracketed field, verify each claim, and match the language to the page's real audience and offer.";

  if (["direct-answer-block", "content-effort-helpfulness", "brand-mention-early"].includes(id)) {
    return {
      label: description ? "Opening summary using your existing description" : "Opening summary framework",
      draft: description || `${brand} helps [specific audience] achieve [specific outcome] through [service or product]. [Add the most important verified differentiator or constraint].`,
      groundedIn,
      reviewNote,
    };
  }

  if (id === "brand-facts") {
    return {
      label: "Brand facts statement",
      draft: `${brand} is a ${topic.toLowerCase()} for [specific customer], helping them solve [specific problem] through [verified capability]. Unlike [relevant alternative], it [verified differentiator].`,
      groundedIn,
      reviewNote,
    };
  }

  if (id === "add-tldr-summary") {
    return {
      label: "Key takeaways block",
      draft: `Key takeaways about ${topic}\n\n• [Most useful conclusion]\n• [Verified supporting fact or example]\n• [Important limitation or tradeoff]\n• [Best next step for the reader]`,
      groundedIn,
      reviewNote,
    };
  }

  if (["question-headings", "answer-capsules", "add-faq"].includes(id)) {
    return {
      label: "Question and answer block",
      draft: `What should someone know about ${topic}?\n\n[Answer in two or three plain sentences. Lead with the conclusion, add one verified detail, and state the next practical step.]`,
      groundedIn,
      reviewNote,
    };
  }

  if (["content-effort-original-evidence", "content-effort-methodology", "content-effort-perspective", "add-proprietary-data"].includes(id)) {
    return {
      label: "First-party evidence block",
      draft: `How we evaluated ${topic}\n\nMethod: [What you reviewed, tested, measured, or observed]\nScope: [Sample, time period, pages, customers, or campaigns included]\nWhat we found: [Specific verified finding]\nTradeoff or limitation: [What the evidence does not prove]\nPractical takeaway: [How the reader should use this finding]`,
      groundedIn,
      reviewNote,
    };
  }

  if (["add-statistics", "current-year-stats", "add-authoritative-citations", "add-expert-quotes"].includes(id)) {
    return {
      label: "Evidence-backed claim block",
      draft: `[Primary source or named expert] found that [verified statistic or claim] in [year]. For readers evaluating ${topic}, this means [specific implication]. [Link to the original source and state any limitation.]`,
      groundedIn,
      reviewNote,
    };
  }

  if (["content-stale-24mo", "content-aging-12mo", "freshness-signal", "explicit-date"].includes(id)) {
    return {
      label: "Freshness and review note",
      draft: `Last reviewed: [Month Year]\n\nWe rechecked [specific claim or section] against [primary source or first-party evidence]. The current guidance for ${topic} is [verified statement].`,
      groundedIn,
      reviewNote,
    };
  }

  if (id === "add-byline") {
    return {
      label: "Reviewer or author block",
      draft: `Written or reviewed by [name], [role]. [Name] has [verified experience relevant to ${topic}]. Last reviewed [date].`,
      groundedIn,
      reviewNote,
    };
  }

  if (["content-effort-curation", "add-lists-tables", "comparison-table", "shorten-paragraphs", "trim-filler", "keyword-stuffing", "passage-restructure", "increase-depth"].includes(id)) {
    return {
      label: "Replacement section outline",
      draft: `${topic}\n\nDirect answer: [State the useful conclusion first.]\nEvidence: [Add one verified example, source, or first-party observation.]\nTradeoff: [Explain when this advice may not apply.]\nNext step: [Give the reader one concrete action.]`,
      groundedIn,
      reviewNote,
    };
  }

  return null;
}
