import * as cheerio from "cheerio";

export type RecPriority = "critical" | "high" | "medium" | "low";

export interface GeoRecommendation {
  id: string;
  title: string;
  detail: string;
  priority: RecPriority;
  category: "answerability" | "authority" | "structure" | "depth" | "freshness" | "technical" | "entity";
  impact: string;
}

export interface ContentSignals {
  wordCount: number;
  hasDirectAnswerOpening: boolean;
  statisticCount: number;
  expertQuoteCount: number;
  citationLinkCount: number;
  authoritativeCitationCount: number;
  faqCount: number;
  listCount: number;
  tableCount: number;
  questionHeadingRatio: number;
  totalHeadings: number;
  hasPublishDate: boolean;
  hasFreshnessSignal: boolean;
  hasByline: boolean;
  brandMentionsEarly: boolean;
  fillerPhraseCount: number;
  longParagraphRatio: number;
}

const FILLER_PHRASES = [
  /in today'?s\s+(?:fast-?paced|digital|modern)\s+world/i,
  /it'?s\s+important\s+to\s+note/i,
  /as\s+we\s+all\s+know/i,
  /when\s+it\s+comes\s+to/i,
  /at\s+the\s+end\s+of\s+the\s+day/i,
  /needless\s+to\s+say/i,
];

const AUTHORITY_DOMAINS = [
  /\.gov(\/|$)/i, /\.edu(\/|$)/i, /\.gov\.[a-z]{2,3}(\/|$)/i,
  /(?:nytimes|wsj|bloomberg|reuters|bbc|economist|nature|science|sciencedirect|pubmed|ncbi|harvard|mit|stanford|forbes|hbr)\./i,
];

export function extractContentSignals($: cheerio.CheerioAPI, url: string, brandName: string | null): ContentSignals {
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // Direct answer opening: first <p> after first heading begins with definition pattern
  const firstParas = $("p").slice(0, 3).map((_, el) => $(el).text().trim()).get().join(" ");
  const opening = firstParas.split(/\s+/).slice(0, 60).join(" ");
  const hasDirectAnswerOpening =
    /^[A-Z][\w\s,'-]{2,40}\s+(?:is|are|refers? to|means?)\s+(?:a|an|the|\d)/i.test(opening) ||
    /^(?:The\s+best|The\s+most|To\s+\w+,?\s+(?:you|the))/i.test(opening);

  // Statistics: percentages, money amounts, large numbers, ratios, dates with "by"
  const statRegex = /\b\d+(?:[.,]\d+)?\s*(?:%|percent|x|×)|\$\s?\d{1,3}(?:[,.]\d{3})*(?:\.\d+)?(?:\s*(?:million|billion|trillion|k|m|b))?|\b\d{1,3}(?:,\d{3})+\b|\b\d+\s+(?:out\s+of|in)\s+\d+\b/gi;
  const statisticCount = (bodyText.match(statRegex) || []).length;

  // Expert quotes: <blockquote> elements OR "Name, Title said/says" patterns
  const blockquotes = $("blockquote").length;
  const attributionRegex = /["“][^"”]{20,400}["”]\s*[—\-–]?\s*(?:said|says|noted|explained|wrote|told|according to)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}/g;
  const namedAttributionRegex = /(?:According to|As\s+stated\s+by|[A-Z][a-z]+\s+[A-Z][a-z]+,\s+(?:CEO|CTO|CFO|founder|professor|researcher|director|analyst|economist|scientist))/g;
  const expertQuoteCount = blockquotes + (bodyText.match(attributionRegex) || []).length + (bodyText.match(namedAttributionRegex) || []).length;

  // Citation links: <a> elements pointing externally
  let citationLinkCount = 0;
  let authoritativeCitationCount = 0;
  let pageHost = "";
  try { pageHost = new URL(url).hostname.replace(/^www\./, ""); } catch {}
  $("article a[href], main a[href], .content a[href], p a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (!/^https?:\/\//i.test(href)) return;
    try {
      const h = new URL(href).hostname.replace(/^www\./, "");
      if (h && h !== pageHost) {
        citationLinkCount++;
        if (AUTHORITY_DOMAINS.some((re) => re.test(href))) authoritativeCitationCount++;
      }
    } catch {}
  });
  if (citationLinkCount === 0) {
    // Fallback: any external link in body
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (!/^https?:\/\//i.test(href)) return;
      try {
        const h = new URL(href).hostname.replace(/^www\./, "");
        if (h && h !== pageHost) {
          citationLinkCount++;
          if (AUTHORITY_DOMAINS.some((re) => re.test(href))) authoritativeCitationCount++;
        }
      } catch {}
    });
  }

  // FAQ patterns: FAQPage schema, headings ending with "?", or definition lists
  const headingTexts: string[] = [];
  $("h1, h2, h3, h4").each((_, el) => headingTexts.push($(el).text().trim()));
  const totalHeadings = headingTexts.length;
  const questionHeadings = headingTexts.filter((h) => /\?$/.test(h)).length;
  const questionHeadingRatio = totalHeadings > 0 ? questionHeadings / totalHeadings : 0;
  const faqCount = questionHeadings + $("dl dt").length;

  const listCount = $("ul, ol").length;
  const tableCount = $("table").length;

  // Freshness: <time> tag, "Updated"/"Published" with year, current/recent year mention
  const currentYear = new Date().getFullYear();
  const recentYearRegex = new RegExp(`\\b(?:${currentYear}|${currentYear - 1})\\b`);
  const hasPublishDate =
    $("time[datetime]").length > 0 ||
    $("meta[property='article:published_time']").length > 0 ||
    /(?:published|posted|updated)(?:\s+on)?\s*[:\-]?\s*[A-Z][a-z]+\s+\d{1,2},?\s+\d{4}/i.test(bodyText.slice(0, 4000));
  const hasFreshnessSignal = hasPublishDate || recentYearRegex.test(bodyText.slice(0, 4000));

  // Byline / author
  const hasByline =
    $("[rel='author'], .author, .byline, [itemprop='author']").length > 0 ||
    $("meta[name='author']").attr("content") !== undefined ||
    /^\s*(?:By\s+|Author[:\s])/im.test(firstParas);

  // Brand entity: brand name appears in first ~200 words
  const brandMentionsEarly = brandName
    ? new RegExp(`\\b${brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(bodyText.slice(0, 1500))
    : false;

  // Filler phrases
  const fillerPhraseCount = FILLER_PHRASES.reduce((n, re) => n + (re.test(bodyText) ? 1 : 0), 0);

  // Long paragraphs (> 120 words)
  const paras = $("p").map((_, el) => $(el).text().trim().split(/\s+/).filter(Boolean).length).get();
  const longParas = paras.filter((n) => n > 120).length;
  const longParagraphRatio = paras.length > 0 ? longParas / paras.length : 0;

  return {
    wordCount,
    hasDirectAnswerOpening,
    statisticCount,
    expertQuoteCount,
    citationLinkCount,
    authoritativeCitationCount,
    faqCount,
    listCount,
    tableCount,
    questionHeadingRatio,
    totalHeadings,
    hasPublishDate,
    hasFreshnessSignal,
    hasByline,
    brandMentionsEarly,
    fillerPhraseCount,
    longParagraphRatio,
  };
}

export interface RecommendationContext {
  signals: ContentSignals;
  hasFaqSchema: boolean;
  hasArticleSchema: boolean;
  hasOrgSchema: boolean;
  hasHowToSchema: boolean;
  hasLlmsTxt: boolean;
  brandName: string | null;
  brandFound: boolean;
  blockedAiCrawlers: string[];
  avgCitabilityScore: number;
}

/**
 * Generates prioritized GEO recommendations grounded in the GEO skill's
 * research-backed principles (Princeton/IIT Delhi KDD 2024): statistics +33.9%,
 * expert quotes +32%, fluent writing +30%, citations +30.3%.
 */
export function generateGeoRecommendations(ctx: RecommendationContext): GeoRecommendation[] {
  const { signals: s } = ctx;
  const recs: GeoRecommendation[] = [];

  // === HIGHEST IMPACT — Authority signals (Princeton research) ===
  if (s.statisticCount < 3) {
    recs.push({
      id: "add-statistics",
      title: s.statisticCount === 0 ? "Add concrete statistics" : "Increase statistical density",
      detail: `Found ${s.statisticCount} numeric data point(s). Add at least one specific stat (percentage, dollar amount, or ratio) per major section. Statistics are the single highest-impact GEO signal.`,
      priority: s.statisticCount === 0 ? "critical" : "high",
      category: "authority",
      impact: "+33.9% AI citation visibility (Princeton/KDD 2024)",
    });
  }

  if (s.expertQuoteCount < 1) {
    recs.push({
      id: "add-expert-quotes",
      title: "Add expert quotes with named attribution",
      detail: "No quoted statements with named attribution detected. Add direct quotes from named experts (\"...,\" said Jane Doe, CEO of Acme) — AI engines weight attributed claims much higher than unsourced opinions.",
      priority: "high",
      category: "authority",
      impact: "+32% AI citation visibility",
    });
  }

  if (s.authoritativeCitationCount < 2) {
    recs.push({
      id: "add-authoritative-citations",
      title: "Cite authoritative sources",
      detail: `Only ${s.authoritativeCitationCount} link(s) to authoritative domains (.gov, .edu, recognized publications). Add inline links to research, studies, or established outlets to boost trust signals.`,
      priority: s.authoritativeCitationCount === 0 ? "high" : "medium",
      category: "authority",
      impact: "+30.3% AI citation visibility",
    });
  }

  // === DIRECT ANSWERABILITY ===
  if (!s.hasDirectAnswerOpening) {
    recs.push({
      id: "direct-answer-block",
      title: "Lead with a 40-60 word direct answer",
      detail: "The opening doesn't begin with a definition pattern (\"X is...\", \"The best Y for Z is...\"). AI engines extract opening statements far more often than buried conclusions. Rewrite the first paragraph to answer the page's core question immediately.",
      priority: "critical",
      category: "answerability",
      impact: "Single highest-impact rewrite per GEO best practices",
    });
  }

  // === STRUCTURE ===
  if (s.totalHeadings >= 3 && s.questionHeadingRatio < 0.3) {
    recs.push({
      id: "question-headings",
      title: "Rephrase headings as questions",
      detail: `Only ${Math.round(s.questionHeadingRatio * 100)}% of headings are phrased as questions. AI engines use H2/H3 as a query map — change "Pricing Information" to "How Much Does X Cost?" to mirror real prompts.`,
      priority: "medium",
      category: "structure",
      impact: "Improves heading-to-prompt matching",
    });
  }

  if (s.faqCount < 5) {
    recs.push({
      id: "add-faq",
      title: "Add an FAQ section with 5-10 questions",
      detail: `Only ${s.faqCount} question-style entries detected. Add an FAQ section using real user phrasing — each Q/A pair becomes an extractable unit for AI engines.`,
      priority: ctx.hasFaqSchema ? "medium" : "high",
      category: "structure",
      impact: "FAQs are among the most-cited content formats",
    });
  }

  if (s.listCount < 2 && s.tableCount === 0) {
    recs.push({
      id: "add-lists-tables",
      title: "Add structured lists or comparison tables",
      detail: "74% of AI citations come from structured lists and comparison formats. Convert dense paragraphs into ranked lists, step-by-steps, or side-by-side tables.",
      priority: "high",
      category: "structure",
      impact: "Lists/tables are the most extractable formats",
    });
  }

  if (s.longParagraphRatio > 0.25) {
    recs.push({
      id: "shorten-paragraphs",
      title: "Break up long paragraphs",
      detail: `${Math.round(s.longParagraphRatio * 100)}% of paragraphs exceed 120 words. Keep paragraphs to 3-5 sentences — dense walls of text get skipped by AI extractors.`,
      priority: "medium",
      category: "structure",
      impact: "Improves passage extractability",
    });
  }

  // === DEPTH ===
  if (s.wordCount < 800) {
    recs.push({
      id: "increase-depth",
      title: "Expand topical coverage",
      detail: `Only ${s.wordCount} words. AI engines prefer comprehensive sources over thin pages. Aim for 1,200-2,000 words covering related questions, edge cases, and follow-ups.`,
      priority: s.wordCount < 400 ? "high" : "medium",
      category: "depth",
      impact: "Depth wins over breadth-only competitors",
    });
  }

  // === FRESHNESS ===
  if (!s.hasFreshnessSignal) {
    recs.push({
      id: "freshness-signal",
      title: "Add a visible date and \"as of\" references",
      detail: "No publish date or recent-year reference detected. Add a publish/updated date and \"as of [year]\" markers — Perplexity and Google AI Overviews deprioritize stale content.",
      priority: "high",
      category: "freshness",
      impact: "Critical for Perplexity & AI Overviews",
    });
  } else if (!s.hasPublishDate) {
    recs.push({
      id: "explicit-date",
      title: "Add an explicit publish date",
      detail: "Year mentions exist but no machine-readable date (<time> tag or article:published_time). Add a visible \"Published / Updated\" date plus structured metadata.",
      priority: "medium",
      category: "freshness",
      impact: "Helps AI engines assess recency",
    });
  }

  // === ENTITY CLARITY ===
  if (ctx.brandName && !s.brandMentionsEarly) {
    recs.push({
      id: "brand-mention-early",
      title: `Name "${ctx.brandName}" in the first 200 words`,
      detail: "Brand name not detected early on the page. AI engines match entities by literal name — replace pronouns and \"the platform\" with the brand name in the opening sections.",
      priority: "medium",
      category: "entity",
      impact: "Improves entity matching in AI answers",
    });
  }

  if (!s.hasByline) {
    recs.push({
      id: "add-byline",
      title: "Add a clear byline with author credentials",
      detail: "No author byline detected. Add a visible \"By [Name], [Title]\" line — author authority is a major E-E-A-T and AI trust signal.",
      priority: "medium",
      category: "authority",
      impact: "Strengthens E-E-A-T",
    });
  }

  if (s.fillerPhraseCount > 0) {
    recs.push({
      id: "trim-filler",
      title: "Trim marketing filler",
      detail: `Detected ${s.fillerPhraseCount} filler phrase(s) ("In today's fast-paced world…", "It's important to note…"). Remove them — every sentence should contain a fact or specific claim.`,
      priority: "low",
      category: "structure",
      impact: "Improves information density",
    });
  }

  // === TECHNICAL — schema gaps ===
  if (!ctx.hasArticleSchema && s.wordCount > 600) {
    recs.push({
      id: "article-schema",
      title: "Add Article JSON-LD schema",
      detail: "Long-form content but no Article schema. Add Article JSON-LD with author, datePublished, and dateModified to give AI engines machine-readable metadata.",
      priority: "medium",
      category: "technical",
      impact: "Enables richer AI extraction",
    });
  }
  if (!ctx.hasFaqSchema && s.faqCount >= 3) {
    recs.push({
      id: "faq-schema",
      title: "Add FAQPage JSON-LD schema",
      detail: "Question-style headings exist but no FAQPage schema. Wrap your Q/A pairs in FAQPage JSON-LD — FAQ schema is among the most reliably extracted by AI engines.",
      priority: "high",
      category: "technical",
      impact: "Direct boost for ChatGPT & AI Overviews",
    });
  }
  if (!ctx.hasOrgSchema) {
    recs.push({
      id: "org-schema",
      title: "Add Organization JSON-LD schema",
      detail: "No Organization schema detected. Add Organization JSON-LD with name, url, logo, and sameAs links to social/Wikipedia profiles to anchor brand identity.",
      priority: "medium",
      category: "technical",
      impact: "Strengthens brand entity recognition",
    });
  }

  if (!ctx.hasLlmsTxt) {
    recs.push({
      id: "llms-txt",
      title: "Publish an llms.txt file",
      detail: "No /llms.txt found. Publish one to give AI crawlers a curated map of your most important pages and how to cite you.",
      priority: "low",
      category: "technical",
      impact: "Emerging standard for AI crawlers",
    });
  }

  if (ctx.blockedAiCrawlers.length > 0) {
    recs.push({
      id: "unblock-crawlers",
      title: "Unblock key AI crawlers",
      detail: `Blocked in robots.txt: ${ctx.blockedAiCrawlers.join(", ")}. If you want to be cited by these engines, allow their user agents.`,
      priority: ctx.blockedAiCrawlers.length >= 3 ? "high" : "medium",
      category: "technical",
      impact: "Prerequisite for citation in those engines",
    });
  }

  if (ctx.avgCitabilityScore < 50) {
    recs.push({
      id: "passage-restructure",
      title: "Restructure passages to 134-167 words with self-contained answers",
      detail: `Average passage citability is ${Math.round(ctx.avgCitabilityScore)}/100. Aim for self-contained 134-167 word passages where each opens with a definition or direct answer and stands alone without surrounding context.`,
      priority: "high",
      category: "answerability",
      impact: "Optimal passage length for AI extraction",
    });
  }

  // Sort by priority
  const order: Record<RecPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  recs.sort((a, b) => order[a.priority] - order[b.priority]);
  return recs;
}
