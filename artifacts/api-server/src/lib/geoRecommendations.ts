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
  currentYearStatCount: number;
  expertQuoteCount: number;
  citationLinkCount: number;
  authoritativeCitationCount: number;
  faqCount: number;
  listCount: number;
  tableCount: number;
  comparisonTableCount: number;
  answerCapsuleCount: number;
  questionHeadingRatio: number;
  totalHeadings: number;
  hasPublishDate: boolean;
  hasFreshnessSignal: boolean;
  contentAgeMonths: number | null;
  hasByline: boolean;
  brandMentionsEarly: boolean;
  fillerPhraseCount: number;
  longParagraphRatio: number;
  keywordStuffingDetected: boolean;
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
  /(?:nytimes|wsj|bloomberg|reuters|bbc|economist|nature|science|sciencedirect|pubmed|ncbi|harvard|mit|stanford|forbes|hbr|arxiv|acm|ieee|hubspot|searchengineland|techtarget)\./i,
];

const QUESTION_WORD_RE = /^(?:who|what|when|where|why|how|which|is|are|do|does|can|should|will)\b/i;

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

  // Current-year stats: stat-like mention within 60 chars of 2025/2026
  const currentYear = new Date().getFullYear();
  const recentYears = [currentYear, currentYear - 1].join("|");
  const currentYearStatRegex = new RegExp(
    `(?:${recentYears})[^.]{0,80}?\\d+\\s*(?:%|percent|x|×|million|billion)|\\d+\\s*(?:%|percent|x|×|million|billion)[^.]{0,80}?(?:${recentYears})`,
    "gi",
  );
  const currentYearStatCount = (bodyText.match(currentYearStatRegex) || []).length;

  // Expert quotes
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

  // Headings + question phrasing
  const headingTexts: string[] = [];
  $("h1, h2, h3, h4").each((_, el) => {
    headingTexts.push($(el).text().trim());
  });
  const totalHeadings = headingTexts.length;
  const questionHeadings = headingTexts.filter((h) => /\?$/.test(h) || QUESTION_WORD_RE.test(h)).length;
  const questionHeadingRatio = totalHeadings > 0 ? questionHeadings / totalHeadings : 0;
  const faqCount = headingTexts.filter((h) => /\?$/.test(h)).length + $("dl dt").length;

  // Answer capsules: count H2s where the immediately following text node / paragraph
  // is a direct-answer block of roughly 40-100 words. (Research target: 40-60 words.)
  let answerCapsuleCount = 0;
  $("h2").each((_, el) => {
    const $h2 = $(el);
    let nextText = "";
    let cur = $h2.next();
    let hops = 0;
    while (cur.length && hops < 3 && nextText.split(/\s+/).filter(Boolean).length < 30) {
      const node = cur.get(0) as { tagName?: string } | undefined;
      const tag = node?.tagName?.toLowerCase?.();
      if (tag === "p" || tag === "div") {
        nextText += " " + cur.text().trim();
      } else if (tag && /^h[1-6]$/.test(tag)) {
        break;
      }
      cur = cur.next();
      hops++;
    }
    const words = nextText.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 30 && words.length <= 100) {
      // Looks like an answer capsule if the first sentence is declarative
      const first = words.slice(0, 25).join(" ");
      if (/^[A-Z]/.test(first) && /[.!]/.test(nextText)) answerCapsuleCount++;
    }
  });

  const listCount = $("ul, ol").length;
  const tableCount = $("table").length;
  // Comparison tables: tables with thead OR >=2 columns and >=2 rows
  let comparisonTableCount = 0;
  $("table").each((_, el) => {
    const $t = $(el);
    const cols = $t.find("tr").first().find("th, td").length;
    const rows = $t.find("tr").length;
    if ((($t.find("thead").length > 0 || $t.find("th").length >= 2) && cols >= 2 && rows >= 2)) {
      comparisonTableCount++;
    }
  });

  // Freshness
  const recentYearRegex = new RegExp(`\\b(?:${currentYear}|${currentYear - 1})\\b`);
  const hasPublishDate =
    $("time[datetime]").length > 0 ||
    $("meta[property='article:published_time']").length > 0 ||
    /(?:published|posted|updated)(?:\s+on)?\s*[:\-]?\s*[A-Z][a-z]+\s+\d{1,2},?\s+\d{4}/i.test(bodyText.slice(0, 4000));
  const hasFreshnessSignal = hasPublishDate || recentYearRegex.test(bodyText.slice(0, 4000));

  // Estimate content age in months using best available datetime
  let contentAgeMonths: number | null = null;
  const dateCandidates: string[] = [];
  $("time[datetime]").each((_, el) => {
    const dt = $(el).attr("datetime");
    if (dt) dateCandidates.push(dt);
  });
  const articleModified = $("meta[property='article:modified_time']").attr("content");
  const articlePublished = $("meta[property='article:published_time']").attr("content");
  if (articleModified) dateCandidates.push(articleModified);
  if (articlePublished) dateCandidates.push(articlePublished);
  let mostRecent: number | null = null;
  for (const d of dateCandidates) {
    const t = Date.parse(d);
    if (!Number.isNaN(t) && t <= Date.now()) {
      if (mostRecent === null || t > mostRecent) mostRecent = t;
    }
  }
  if (mostRecent !== null) {
    contentAgeMonths = Math.max(0, Math.round((Date.now() - mostRecent) / (1000 * 60 * 60 * 24 * 30.44)));
  }

  // Byline / author
  const hasByline =
    $("[rel='author'], .author, .byline, [itemprop='author']").length > 0 ||
    $("meta[name='author']").attr("content") !== undefined ||
    /^\s*(?:By\s+|Author[:\s])/im.test(firstParas);

  // Brand entity in first ~1500 chars
  const brandMentionsEarly = brandName
    ? new RegExp(`\\b${brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(bodyText.slice(0, 1500))
    : false;

  // Filler phrases
  const fillerPhraseCount = FILLER_PHRASES.reduce((n, re) => n + (re.test(bodyText) ? 1 : 0), 0);

  // Long paragraphs (> 120 words)
  const paras = $("p").map((_, el) => $(el).text().trim().split(/\s+/).filter(Boolean).length).get();
  const longParas = paras.filter((n) => n > 120).length;
  const longParagraphRatio = paras.length > 0 ? longParas / paras.length : 0;

  // Keyword stuffing: any non-stopword that occurs > 2.5% of total words
  let keywordStuffingDetected = false;
  if (wordCount >= 300) {
    const stop = new Set([
      "the","and","for","with","that","this","you","your","are","not","but","from","have","has","was","were","they","their","them",
      "our","its","into","over","more","than","such","also","can","will","one","two","other","about","when","what","how","who","why",
      "all","any","may","use","used","using","get","got","new","most","only","just","like","each","some","because","because",
    ]);
    const tokens = bodyText.toLowerCase().match(/[a-z]{4,}/g) || [];
    const counts = new Map<string, number>();
    for (const t of tokens) {
      if (stop.has(t)) continue;
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    const total = tokens.length || 1;
    for (const [, n] of counts) {
      if (n / total > 0.025 && n >= 12) {
        keywordStuffingDetected = true;
        break;
      }
    }
  }

  return {
    wordCount,
    hasDirectAnswerOpening,
    statisticCount,
    currentYearStatCount,
    expertQuoteCount,
    citationLinkCount,
    authoritativeCitationCount,
    faqCount,
    listCount,
    tableCount,
    comparisonTableCount,
    answerCapsuleCount,
    questionHeadingRatio,
    totalHeadings,
    hasPublishDate,
    hasFreshnessSignal,
    contentAgeMonths,
    hasByline,
    brandMentionsEarly,
    fillerPhraseCount,
    longParagraphRatio,
    keywordStuffingDetected,
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
 * Generates prioritized GEO recommendations grounded in current research:
 *   - KDD 2024 (Princeton/IIT Delhi): statistics +33.9%, expert quotes +32%,
 *     fluent writing +30%, citations +30.3%.
 *   - arXiv 2509.08919 (Sept 2025): earned-media bias, freshness 3.2x within
 *     12 months, FAQ + comprehensive coverage out-perform thin pages.
 *   - 2026 practitioner consensus (Semrush, HubSpot, Search Engine Land,
 *     Profound, Botify, Frase): answer capsules, conversational H2s, named
 *     authors, comparison tables for agentic search; llms.txt deprioritized.
 */
export function generateGeoRecommendations(ctx: RecommendationContext): GeoRecommendation[] {
  const { signals: s } = ctx;
  const recs: GeoRecommendation[] = [];

  // === HIGHEST IMPACT — Authority signals ===
  if (s.statisticCount < 3) {
    recs.push({
      id: "add-statistics",
      title: s.statisticCount === 0 ? "Add concrete statistics" : "Increase statistical density",
      detail: `Found ${s.statisticCount} numeric data point(s). Add at least one specific stat (percentage, dollar amount, or ratio) per major section. Statistics remain the single highest-impact GEO signal across all four major engines.`,
      priority: s.statisticCount === 0 ? "critical" : "high",
      category: "authority",
      impact: "+33.9% AI citation visibility (Princeton/KDD 2024)",
    });
  }

  if (s.currentYearStatCount === 0 && s.statisticCount > 0) {
    const yr = new Date().getFullYear();
    recs.push({
      id: "current-year-stats",
      title: `Cite ${yr - 1}/${yr} statistics`,
      detail: `Statistics exist on the page but none are tied to ${yr - 1} or ${yr}. AI engines (especially Perplexity & Google AI Overviews) heavily favor recent data — replace older figures with current-year numbers and cite their source.`,
      priority: "high",
      category: "freshness",
      impact: "83% of commercial AI citations come from sources updated in the past 12 months (2026 practitioner data)",
    });
  }

  if (s.expertQuoteCount < 1) {
    recs.push({
      id: "add-expert-quotes",
      title: "Add expert quotes with named attribution",
      detail: "No quoted statements with named attribution detected. Add direct quotes from named experts (\"...,\" said Jane Doe, CEO of Acme) — AI engines weight attributed claims much higher than unsourced opinions.",
      priority: "high",
      category: "authority",
      impact: "+32% AI citation visibility (Princeton/KDD 2024)",
    });
  }

  if (s.authoritativeCitationCount < 2) {
    recs.push({
      id: "add-authoritative-citations",
      title: "Add 2-5 outbound links to authoritative sources",
      detail: `Only ${s.authoritativeCitationCount} link(s) to authoritative domains (.gov, .edu, established publications). Content that performs across ChatGPT, Claude, and Perplexity carries 2-5 outbound links to third-party authoritative sources per article — this is now the 2026 baseline.`,
      priority: s.authoritativeCitationCount === 0 ? "high" : "medium",
      category: "authority",
      impact: "+30.3% AI citation visibility; 2-5 outbound citations is the 2026 standard",
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
      impact: "Highest-leverage rewrite per 2026 GEO practitioner data",
    });
  }

  // Answer capsules: 40-60 word direct-answer block after each H2
  const h2Count = Math.max(1, s.totalHeadings); // rough denominator
  if (s.answerCapsuleCount < 2 && s.totalHeadings >= 3) {
    recs.push({
      id: "answer-capsules",
      title: "Add 40-60 word answer capsules after each H2",
      detail: `Detected ${s.answerCapsuleCount} answer capsule(s). After every major H2, place a 40-60 word self-contained answer that states the conclusion definitively before elaboration. This is the single most extractable pattern in 2026 — AI engines literally lift this block as a citation.`,
      priority: s.answerCapsuleCount === 0 ? "high" : "medium",
      category: "answerability",
      impact: "+35-40% extraction rate (2026 practitioner consensus)",
    });
  }

  // === STRUCTURE ===
  if (s.totalHeadings >= 3 && s.questionHeadingRatio < 0.3) {
    recs.push({
      id: "question-headings",
      title: "Phrase headings as conversational questions",
      detail: `Only ${Math.round(s.questionHeadingRatio * 100)}% of headings are phrased as questions or use question words (who/what/why/how). Mirror real prompts — change "Pricing Information" to "How Much Does X Cost?" — AI engines treat H2/H3 as a query map.`,
      priority: "medium",
      category: "structure",
      impact: "Improves heading-to-prompt matching; conversational H2s are a validated 2026 signal",
    });
  }

  if (s.faqCount < 5) {
    recs.push({
      id: "add-faq",
      title: "Add an FAQ section with 10-15 questions",
      detail: `Only ${s.faqCount} question-style entries detected. One detailed FAQ page with 10-15 questions reliably out-performs nearly every other on-page tactic for AI citations — and far out-performs publishing an llms.txt file.`,
      priority: ctx.hasFaqSchema ? "medium" : "high",
      category: "structure",
      impact: "+40% citation likelihood; FAQ schema is the highest-ROI structured data in 2026",
    });
  }

  if (s.listCount < 2 && s.tableCount === 0) {
    recs.push({
      id: "add-lists-tables",
      title: "Add structured lists or comparison tables",
      detail: "AI extractors heavily favor structured lists, step-by-steps, and comparison tables over dense paragraphs. Convert prose into ranked lists, numbered steps, or side-by-side comparisons.",
      priority: "high",
      category: "structure",
      impact: "Lists/tables are the most extractable formats across all four engines",
    });
  }

  // Comparison tables for agentic search (Operator, Comet, etc.)
  if (s.comparisonTableCount === 0 && s.wordCount > 600) {
    recs.push({
      id: "comparison-table",
      title: "Add a comparison table (pricing, features, or alternatives)",
      detail: "No comparison tables detected. Agentic search (OpenAI Operator, Perplexity Comet) browses, compares, and completes tasks — pages with machine-readable comparison tables get pulled into agent workflows far more often than prose-only pages.",
      priority: "medium",
      category: "structure",
      impact: "Critical for inclusion in agentic-search workflows (2026 emerging priority)",
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

  // === FRESHNESS — upgraded with 2026 decay function ===
  const age = s.contentAgeMonths;
  if (age !== null && age > 24) {
    recs.push({
      id: "content-stale-24mo",
      title: `Refresh stale content (last updated ~${age} months ago)`,
      detail: "Content older than 24 months earns roughly 0.3x the citations of content updated within the past 12 months. Substantively revise (not just a date bump — AI engines detect cosmetic changes), update statistics to current year, and re-publish.",
      priority: "critical",
      category: "freshness",
      impact: "3.2x citation lift moving from >24mo to <12mo (2026 practitioner data)",
    });
  } else if (age !== null && age > 12) {
    recs.push({
      id: "content-aging-12mo",
      title: `Refresh aging content (last updated ~${age} months ago)`,
      detail: "Content past the 12-month freshness threshold loses citation share, especially on Perplexity and Google AI Overviews. Plan a substantive quarterly refresh — update stats, add new examples, and bump the visible date.",
      priority: "high",
      category: "freshness",
      impact: "Up to 3.2x citation lift returning to <12mo freshness window",
    });
  } else if (!s.hasFreshnessSignal) {
    recs.push({
      id: "freshness-signal",
      title: "Add a visible \"Last Updated\" date and current-year markers",
      detail: "No publish date or recent-year reference detected. Add a visible \"Last Updated: [Month YYYY]\" line plus current-year statistics — Perplexity and Google AI Overviews aggressively deprioritize stale-looking content.",
      priority: "high",
      category: "freshness",
      impact: "Critical for Perplexity & Google AI Overviews",
    });
  } else if (!s.hasPublishDate) {
    recs.push({
      id: "explicit-date",
      title: "Add a machine-readable publish date",
      detail: "Year mentions exist but no <time> tag or article:published_time meta. Add structured datetime metadata so AI engines can verify recency.",
      priority: "medium",
      category: "freshness",
      impact: "Helps AI engines verify recency",
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

  // Byline upgraded to required (2026)
  if (!s.hasByline) {
    recs.push({
      id: "add-byline",
      title: "Add a named-author byline with credentials",
      detail: "No author byline detected. Add a visible \"By [Name], [Title with credentials]\" line linked to an author page. Claude in particular requires visible author credibility, and named authors are part of the 2026 baseline for content cited across all four engines.",
      priority: "high",
      category: "authority",
      impact: "Required signal for Claude + E-E-A-T (2026 practitioner consensus)",
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

  // Keyword stuffing — explicit penalty (2026)
  if (s.keywordStuffingDetected) {
    recs.push({
      id: "keyword-stuffing",
      title: "Reduce repeated-keyword density",
      detail: "A single non-stopword exceeds 2.5% of total page words. Traditional keyword stuffing is now actively harmful in generative-engine contexts — AI models penalize obviously over-optimized prose. Rewrite for natural variation and synonym use.",
      priority: "medium",
      category: "structure",
      impact: "Removes a confirmed 2026 negative signal",
    });
  }

  // === TECHNICAL — schema gaps ===
  if (!ctx.hasArticleSchema && s.wordCount > 600) {
    recs.push({
      id: "article-schema",
      title: "Add Article JSON-LD schema",
      detail: "Long-form content but no Article schema. Add Article JSON-LD with author, datePublished, and dateModified — and also include a Person entry for the author so the author becomes a recognizable entity to AI engines.",
      priority: "medium",
      category: "technical",
      impact: "Enables richer AI extraction; Person+Article is the 2026 best-practice combo",
    });
  }
  if (!ctx.hasFaqSchema && s.faqCount >= 3) {
    recs.push({
      id: "faq-schema",
      title: "Add FAQPage JSON-LD schema",
      detail: "Question-style headings exist but no FAQPage schema. Wrap your Q/A pairs in FAQPage JSON-LD — it remains the highest-ROI structured-data type for AI citations in 2026.",
      priority: "high",
      category: "technical",
      impact: "Direct citation boost for ChatGPT & Google AI Overviews",
    });
  }
  if (!ctx.hasOrgSchema) {
    recs.push({
      id: "org-schema",
      title: "Add Organization JSON-LD schema",
      detail: "No Organization schema detected. Add Organization JSON-LD with name, url, logo, and sameAs links to social profiles, Wikipedia, and Crunchbase to anchor brand identity in the AI knowledge graph.",
      priority: "medium",
      category: "technical",
      impact: "Strengthens brand entity recognition; addresses 2026 \"earned-media bias\"",
    });
  }

  // llms.txt — DOWNGRADED per 2026 evidence
  if (!ctx.hasLlmsTxt) {
    recs.push({
      id: "llms-txt",
      title: "Optionally publish an llms.txt file",
      detail: "No /llms.txt found. The 2026 evidence is mixed — only 1 of the 50 most-cited domains uses one, and major engines do not appear to rely on it. Publishing one is cheap and harmless, but prioritize FAQ content and answer capsules first; they deliver far higher citation ROI.",
      priority: "low",
      category: "technical",
      impact: "Optional scaffolding — minimal measurable lift in 2026",
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
