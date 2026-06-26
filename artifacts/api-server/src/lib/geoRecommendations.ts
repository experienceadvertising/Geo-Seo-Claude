import * as cheerio from "cheerio";
import {
  getRecommendation,
  type Recommendation,
  type SourceType,
  type ExpectedLift,
} from "@workspace/recommendations";

export type RecPriority = "critical" | "high" | "medium" | "low";

/**
 * Source-attribution metadata attached to each runtime recommendation, sourced
 * from the @workspace/recommendations catalog. The client renders this as a
 * badge ("research" / "internal benchmark" / "practitioner consensus", with a
 * verified checkmark when applicable) plus a link to the cited source.
 *
 * All fields are optional on the response shape so legacy audits stored before
 * the catalog existed (and which therefore lack `source`) continue to render
 * via the pre-catalog code path. The frontend uses the top-level
 * `recommendationsSchemaVersion` field to decide whether to render badges.
 */
export interface RecommendationSource {
  type: SourceType;
  url: string | null;
  citation: string;
  verified: boolean;
  lastVerifiedAt: string | null;
  /** Methodology-page editorial notes; safe to render in a tooltip / details panel. */
  notes?: string;
}

export interface GeoRecommendation {
  id: string;
  title: string;
  detail: string;
  priority: RecPriority;
  category: "answerability" | "authority" | "structure" | "depth" | "freshness" | "technical" | "entity";
  impact: string;
  /**
   * Structured lift claim. `null` when no defensible precise number exists for
   * this recommendation (the qualitative case is in `impact`). Optional so
   * legacy audits without source enrichment still satisfy the type.
   */
  expectedLift?: ExpectedLift | null;
  /** Source-attribution metadata. Optional for legacy compatibility. */
  source?: RecommendationSource;
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
  /** True if the page has a TL;DR, Key Takeaways, or Summary heading. */
  hasTldr: boolean;
  /** True if the page cites original first-party data ("our research", "we surveyed", etc.). */
  hasProprietaryData: boolean;
  /** True if the page has at least one ordered list with 3+ items (step-by-step candidate). */
  hasNumberedStepList: boolean;
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
  const namedQuotes = (bodyText.match(/[""][^""]{20,}[""]\s*[-—–]?\s*(?:said|told|according to)\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g) || []).length;
  const expertQuoteCount = blockquotes + namedQuotes;

  // Citation links: external links to non-self domains
  let citationLinkCount = 0;
  let authoritativeCitationCount = 0;
  try {
    const selfHost = new URL(url).hostname.replace(/^www\./, "");
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (!/^https?:\/\//i.test(href)) return;
      try {
        const linkHost = new URL(href).hostname.replace(/^www\./, "");
        if (linkHost === selfHost) return;
        citationLinkCount++;
        if (AUTHORITY_DOMAINS.some((re) => re.test(href))) authoritativeCitationCount++;
      } catch { /* ignore malformed */ }
    });
  } catch { /* ignore bad page url */ }

  // FAQ entries
  const headingTexts = $("h1,h2,h3,h4").map((_, el) => $(el).text().trim()).get();
  const faqCount = headingTexts.filter((t) => /\?$/.test(t) || /^(?:how|what|why|when|where|which|who|can|do|does|is|are|should)\b/i.test(t)).length;

  // Lists & tables
  const listCount = $("ul,ol").length;
  const tableCount = $("table").length;

  // Comparison tables: tables with comparison-y headers
  let comparisonTableCount = 0;
  $("table").each((_, t) => {
    const headerText = $(t).find("th").map((_, th) => $(th).text().toLowerCase()).get().join(" ");
    if (/(?:vs\.?|versus|compare|comparison|feature|price|plan)/i.test(headerText)) {
      comparisonTableCount++;
    }
  });

  // Answer capsules: short (40-60 word) <p> immediately following an h2/h3
  let answerCapsuleCount = 0;
  $("h2,h3").each((_, h) => {
    const next = $(h).next("p");
    if (!next.length) return;
    const wc = next.text().trim().split(/\s+/).filter(Boolean).length;
    if (wc >= 30 && wc <= 80) answerCapsuleCount++;
  });

  // Question heading ratio
  const totalHeadings = headingTexts.length;
  const questionHeadings = headingTexts.filter((t) => QUESTION_WORD_RE.test(t) || /\?$/.test(t)).length;
  const questionHeadingRatio = totalHeadings > 0 ? questionHeadings / totalHeadings : 0;

  // Publish / freshness
  const hasPublishDate =
    $("time[datetime]").length > 0 ||
    $('meta[property="article:published_time"]').length > 0 ||
    $('meta[name="date"]').length > 0;

  const currentYearStr = String(currentYear);
  const prevYearStr = String(currentYear - 1);
  const hasFreshnessSignal =
    hasPublishDate ||
    /\bupdated\s*:?\s*[A-Z][a-z]+\s+\d{1,2},?\s+\d{4}\b/i.test(bodyText) ||
    new RegExp(`\\b(?:${currentYearStr}|${prevYearStr})\\b`).test(bodyText.slice(0, 1000));

  // Content age in months from <time datetime>, og meta, or visible "Updated" line
  let contentAgeMonths: number | null = null;
  const candidateDates: string[] = [];
  $("time[datetime]").each((_, el) => {
    const v = $(el).attr("datetime");
    if (v) candidateDates.push(v);
  });
  $('meta[property="article:modified_time"]').each((_, el) => {
    const v = $(el).attr("content");
    if (v) candidateDates.push(v);
  });
  $('meta[property="article:published_time"]').each((_, el) => {
    const v = $(el).attr("content");
    if (v) candidateDates.push(v);
  });
  const updatedMatch = bodyText.match(/\bupdated\s*:?\s*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\b/i);
  if (updatedMatch) candidateDates.push(updatedMatch[1]);

  const now = Date.now();
  for (const ds of candidateDates) {
    const t = Date.parse(ds);
    if (Number.isFinite(t)) {
      const months = Math.floor((now - t) / (1000 * 60 * 60 * 24 * 30.44));
      if (months >= 0 && (contentAgeMonths === null || months < contentAgeMonths)) {
        contentAgeMonths = months;
      }
    }
  }

  // Byline: visible "By [Name]" line, or rel=author link, or Person JSON-LD
  let hasByline =
    /\bby\s+[A-Z][a-z]+\s+[A-Z][a-z]+/.test(bodyText.slice(0, 2000)) ||
    $('a[rel="author"]').length > 0 ||
    $('[itemprop="author"]').length > 0;
  if (!hasByline) {
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).contents().text();
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of arr) {
          if (item && typeof item === "object" && item.author) {
            hasByline = true;
            return;
          }
        }
      } catch { /* ignore */ }
    });
  }

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

  // TL;DR / key takeaways: any heading matching common summary patterns
  const hasTldr = $("h1,h2,h3,h4")
    .toArray()
    .some((el) => /\b(?:tl[;:]?dr|key\s+takeaways?|summary|quick\s+summary|in\s+brief|bottom\s+line)\b/i.test($(el).text()));

  // Proprietary data: first-party research language in body
  const hasProprietaryData = /\b(?:our\s+(?:research|study|survey|data|analysis|findings?)|we\s+(?:surveyed|analyzed|studied|found\s+that)|original\s+(?:research|data|study)|proprietary\s+data|internal\s+(?:data|research|analysis))\b/i.test(bodyText);

  // Numbered step list: at least one <ol> with 3+ <li> items
  const hasNumberedStepList = $("ol").toArray().some((ol) => $(ol).find("li").length >= 3);

  // Keyword stuffing: any non-stopword that occurs > 2.5% of total words.
  // We exclude the brand's own name, domain root, and any tokens drawn from the
  // page <title> or Organization schema name — repeating your own brand on your
  // own site is not stuffing, it is expected.
  let keywordStuffingDetected = false;
  if (wordCount >= 300) {
    const stop = new Set([
      "the","and","for","with","that","this","you","your","are","not","but","from","have","has","was","were","they","their","them",
      "our","its","into","over","more","than","such","also","can","will","one","two","other","about","when","what","how","who","why",
      "all","any","may","use","used","using","get","got","new","most","only","just","like","each","some","because",
    ]);

    const ignore = new Set<string>();
    const addTokens = (s: string | null | undefined) => {
      if (!s) return;
      const toks = s.toLowerCase().match(/[a-z]{4,}/g) || [];
      for (const t of toks) ignore.add(t);
    };
    addTokens(brandName);
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      const root = host.split(".")[0];
      if (root.length >= 4) ignore.add(root.toLowerCase());
      for (const t of host.toLowerCase().match(/[a-z]{4,}/g) || []) ignore.add(t);
    } catch {}
    addTokens($("title").first().text());
    $('script[type="application/ld+json"]').each((_, el) => {
      const raw = $(el).contents().text();
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of arr) {
          if (!item || typeof item !== "object") continue;
          const types = ([] as string[]).concat(item["@type"] || []);
          if (types.some((t) => /^(Organization|LocalBusiness|WebSite|Brand|Corporation)$/i.test(t))) {
            addTokens(item.name);
            addTokens(item.alternateName);
            if (item.legalName) addTokens(item.legalName);
          }
        }
      } catch { /* ignore malformed JSON-LD */ }
    });

    const tokens = bodyText.toLowerCase().match(/[a-z]{4,}/g) || [];
    const counts = new Map<string, number>();
    for (const t of tokens) {
      if (stop.has(t) || ignore.has(t)) continue;
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
    hasTldr,
    hasProprietaryData,
    hasNumberedStepList,
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
  /** True when a nosnippet / max-snippet:0 directive was detected. Critical finding. */
  hasNoSnippet?: boolean;
  /**
   * 0-100 score for how early the first substantive content block appears.
   * Lower score = content is buried and risks being cut off by AI retrieval caps.
   */
  contentPlacementScore?: number;
}

/**
 * Compose a runtime GeoRecommendation by merging trigger-supplied dynamic fields
 * (the WHEN/HOW-SEVERE-RIGHT-NOW) with the @workspace/recommendations catalog
 * entry (the WHAT/WHY/SOURCE).
 *
 * - `title`    — override only when the trigger needs interpolation (e.g. brand
 *                name, year) or a variant title (e.g. "Add concrete statistics"
 *                vs. "Increase statistical density"). Otherwise the catalog's
 *                `titleTemplate` is used as-is.
 * - `detail`   — always trigger-supplied, since it incorporates live signal
 *                values and prescriptive guidance.
 * - `priority` — override when severity is signal-conditional. Otherwise the
 *                catalog `severity` is used.
 * - `impact`   — sourced from the catalog's qualitative `claim`. Precise lift
 *                numbers, when defensible, will be exposed via the `source`
 *                metadata field added in the upcoming API enrichment commit
 *                (commit 3) — not in this string.
 */
function composeRec(
  id: string,
  dynamic: { title?: string; detail: string; priority?: RecPriority },
): GeoRecommendation {
  const cat: Recommendation | undefined = getRecommendation(id);
  if (!cat) {
    throw new Error(
      `geoRecommendations: trigger emitted unknown recommendation id '${id}'. ` +
      `Either add it to lib/recommendations/data/recommendations.json or fix the trigger.`,
    );
  }
  const source: RecommendationSource = {
    type: cat.sourceType,
    url: cat.sourceUrl,
    citation: cat.sourceCitation,
    verified: cat.verified,
    lastVerifiedAt: cat.lastVerifiedAt,
    ...(cat.notes !== undefined ? { notes: cat.notes } : {}),
  };
  return {
    id,
    title: dynamic.title ?? cat.titleTemplate,
    detail: dynamic.detail,
    priority: dynamic.priority ?? cat.severity,
    category: cat.category,
    impact: cat.claim,
    expectedLift: cat.expectedLift,
    source,
  };
}

/**
 * Generates prioritized GEO recommendations.
 *
 * The trigger code in this function decides WHEN each recommendation fires and
 * WITH WHAT live signal values. The recommendation's metadata — qualitative
 * claim, source citation, source URL, verification status — lives in the
 * @workspace/recommendations catalog and is composed in by composeRec().
 *
 * Per the source-every-claim migration (May 2026): precise quantitative lift
 * figures are no longer hard-coded into the `impact` string here. The catalog
 * carries `expectedLift` (currently null for all recs pending defensible
 * sourcing) and `sourceCitation` (qualitative attribution); the upcoming API
 * enrichment commit surfaces these to the client so the UI can render source
 * badges with proper citation hygiene.
 */
export function generateGeoRecommendations(ctx: RecommendationContext): GeoRecommendation[] {
  const { signals: s } = ctx;
  const recs: GeoRecommendation[] = [];

  // === HIGHEST IMPACT — Authority signals ===
  if (s.statisticCount < 3) {
    recs.push(composeRec("add-statistics", {
      title: s.statisticCount === 0 ? undefined /* catalog default */ : "Increase statistical density",
      detail: `Found ${s.statisticCount} numeric data point(s). Add at least one specific stat (percentage, dollar amount, or ratio) per major section. Statistics remain among the highest-impact GEO signals across all four major engines.`,
      priority: s.statisticCount === 0 ? "critical" : "high",
    }));
  }

  if (s.currentYearStatCount === 0 && s.statisticCount > 0) {
    const yr = new Date().getFullYear();
    recs.push(composeRec("current-year-stats", {
      title: `Cite ${yr - 1}/${yr} statistics`,
      detail: `Statistics exist on the page but none are tied to ${yr - 1} or ${yr}. AI engines (especially Perplexity & Google AI Overviews) heavily favor recent data — replace older figures with current-year numbers and cite their source.`,
    }));
  }

  if (s.expertQuoteCount < 1) {
    recs.push(composeRec("add-expert-quotes", {
      detail: "No quoted statements with named attribution detected. Add direct quotes from named experts (\"...,\" said Jane Doe, CEO of Acme) — AI engines weight attributed claims much higher than unsourced opinions.",
    }));
  }

  if (s.authoritativeCitationCount < 2) {
    recs.push(composeRec("add-authoritative-citations", {
      detail: `Only ${s.authoritativeCitationCount} link(s) to authoritative domains (.gov, .edu, established publications). Content that performs across ChatGPT, Claude, and Perplexity carries 2-5 outbound links to third-party authoritative sources per article — this is now the 2026 baseline.`,
      priority: s.authoritativeCitationCount === 0 ? "high" : "medium",
    }));
  }

  if (!s.hasProprietaryData && s.wordCount > 600) {
    recs.push(composeRec("add-proprietary-data", {
      detail: "No original first-party data detected (\"our research\", \"we surveyed\", etc.). Add at least one data point from your own research, a customer survey, or a case study outcome — original data is preferentially cited because AI engines cannot find it elsewhere.",
      priority: "medium",
    }));
  }

  // TL;DR / key takeaways
  if (s.wordCount > 800 && !s.hasTldr) {
    recs.push(composeRec("add-tldr-summary", {
      detail: `Page has ${s.wordCount} words but no TL;DR, Key Takeaways, or Summary heading. Add a 3-5 bullet summary near the top — AI engines frequently extract these as citation openings and for generating quick answers to user queries.`,
      priority: s.wordCount > 1500 ? "high" : "medium",
    }));
  }

  // === DIRECT ANSWERABILITY ===
  if (!s.hasDirectAnswerOpening) {
    recs.push(composeRec("direct-answer-block", {
      detail: "The opening doesn't begin with a definition pattern (\"X is...\", \"The best Y for Z is...\"). AI engines extract opening statements far more often than buried conclusions. Rewrite the first paragraph to answer the page's core question immediately.",
    }));
  }

  if (s.answerCapsuleCount < 2 && s.totalHeadings >= 3) {
    recs.push(composeRec("answer-capsules", {
      detail: `Detected ${s.answerCapsuleCount} answer capsule(s). After every major H2, place a 40-60 word self-contained answer that states the conclusion definitively before elaboration. This is among the most extractable patterns in 2026 — AI engines literally lift this block as a citation.`,
      priority: s.answerCapsuleCount === 0 ? "high" : "medium",
    }));
  }

  // === STRUCTURE ===
  if (s.totalHeadings >= 3 && s.questionHeadingRatio < 0.3) {
    recs.push(composeRec("question-headings", {
      detail: `Only ${Math.round(s.questionHeadingRatio * 100)}% of headings are phrased as questions or use question words (who/what/why/how). Mirror real prompts — change "Pricing Information" to "How Much Does X Cost?" — AI engines treat H2/H3 as a query map.`,
    }));
  }

  if (s.faqCount < 5) {
    recs.push(composeRec("add-faq", {
      detail: `Only ${s.faqCount} question-style entries detected. One detailed FAQ page with 10-15 questions is reliably one of the strongest on-page tactics for AI citations — and far out-performs publishing an llms.txt file.`,
      priority: ctx.hasFaqSchema ? "medium" : "high",
    }));
  }

  if (s.listCount < 2 && s.tableCount === 0) {
    recs.push(composeRec("add-lists-tables", {
      detail: "AI extractors heavily favor structured lists, step-by-steps, and comparison tables over dense paragraphs. Convert prose into ranked lists, numbered steps, or side-by-side comparisons.",
    }));
  }

  if (s.comparisonTableCount === 0 && s.wordCount > 600) {
    recs.push(composeRec("comparison-table", {
      detail: "No comparison tables detected. Agentic search (OpenAI Operator, Perplexity Comet) browses, compares, and completes tasks — pages with machine-readable comparison tables get pulled into agent workflows far more often than prose-only pages.",
    }));
  }

  if (s.longParagraphRatio > 0.25) {
    recs.push(composeRec("shorten-paragraphs", {
      detail: `${Math.round(s.longParagraphRatio * 100)}% of paragraphs exceed 120 words. Keep paragraphs to 3-5 sentences — dense walls of text get skipped by AI extractors.`,
    }));
  }

  // === DEPTH ===
  if (s.wordCount < 800) {
    recs.push(composeRec("increase-depth", {
      detail: `Only ${s.wordCount} words. AI engines prefer comprehensive sources over thin pages. Aim for 1,200-2,000 words covering related questions, edge cases, and follow-ups.`,
      priority: s.wordCount < 400 ? "high" : "medium",
    }));
  }

  // === FRESHNESS ===
  const age = s.contentAgeMonths;
  if (age !== null && age > 24) {
    recs.push(composeRec("content-stale-24mo", {
      title: `Refresh stale content (last updated ~${age} months ago)`,
      detail: "Content older than 24 months is consistently down-weighted by generative engines that prefer recent sources. Substantively revise (not just a date bump — AI engines detect cosmetic changes), update statistics to current year, and re-publish.",
    }));
  } else if (age !== null && age > 12) {
    recs.push(composeRec("content-aging-12mo", {
      title: `Refresh aging content (last updated ~${age} months ago)`,
      detail: "Content past the 12-month freshness threshold loses citation share, especially on Perplexity and Google AI Overviews. Plan a substantive quarterly refresh — update stats, add new examples, and bump the visible date.",
    }));
  } else if (!s.hasFreshnessSignal) {
    recs.push(composeRec("freshness-signal", {
      detail: "No publish date or recent-year reference detected. Add a visible \"Last Updated: [Month YYYY]\" line plus current-year statistics — Perplexity and Google AI Overviews aggressively deprioritize stale-looking content.",
    }));
  } else if (!s.hasPublishDate) {
    recs.push(composeRec("explicit-date", {
      detail: "Year mentions exist but no <time> tag or article:published_time meta. Add structured datetime metadata so AI engines can verify recency.",
    }));
  }

  // === ENTITY CLARITY ===
  if (ctx.brandName && !s.brandMentionsEarly) {
    recs.push(composeRec("brand-mention-early", {
      title: `Name "${ctx.brandName}" in the first 200 words`,
      detail: "Brand name not detected early on the page. AI engines match entities by literal name — replace pronouns and \"the platform\" with the brand name in the opening sections.",
    }));
  }

  if (!s.hasByline) {
    recs.push(composeRec("add-byline", {
      detail: "No author byline detected. Add a visible \"By [Name], [Title with credentials]\" line linked to an author page. Claude in particular requires visible author credibility, and named authors are part of the 2026 baseline for content cited across all four engines.",
    }));
  }

  if (s.fillerPhraseCount > 0) {
    recs.push(composeRec("trim-filler", {
      detail: `Detected ${s.fillerPhraseCount} filler phrase(s) ("In today's fast-paced world…", "It's important to note…"). Remove them — every sentence should contain a fact or specific claim.`,
    }));
  }

  if (s.keywordStuffingDetected) {
    recs.push(composeRec("keyword-stuffing", {
      detail: "A single non-stopword exceeds 2.5% of total page words. Traditional keyword stuffing is actively harmful in generative-engine contexts — research identifies it as a non-performing optimization method. Rewrite for natural variation and synonym use.",
    }));
  }

  // === TECHNICAL — schema gaps ===
  if (!ctx.hasArticleSchema && s.wordCount > 600) {
    recs.push(composeRec("article-schema", {
      detail: "Long-form content but no Article schema. Add Article JSON-LD with author, datePublished, and dateModified — and also include a Person entry for the author so the author becomes a recognizable entity to AI engines.",
    }));
  }
  if (!ctx.hasFaqSchema && s.faqCount >= 3) {
    recs.push(composeRec("faq-schema", {
      detail: "Question-style headings exist but no FAQPage schema. Wrap your Q/A pairs in FAQPage JSON-LD — it remains among the highest-ROI structured-data types for AI citations in 2026.",
    }));
  }
  if (s.hasNumberedStepList && !ctx.hasHowToSchema) {
    recs.push(composeRec("howto-schema", {
      detail: "Numbered step-by-step list detected but no HowTo JSON-LD schema. Wrap the steps in HowTo schema — it enables richer AI extraction and distinct step-level rich results in Google AI Overviews for instructional queries.",
    }));
  }
  if (!ctx.hasOrgSchema) {
    recs.push(composeRec("org-schema", {
      detail: "No Organization schema detected. Add Organization JSON-LD with name, url, logo, and sameAs links to social profiles, Wikipedia, and Crunchbase to anchor brand identity in the AI knowledge graph.",
    }));
  }

  if (!ctx.hasLlmsTxt) {
    recs.push(composeRec("llms-txt", {
      detail: "No /llms.txt found. The 2026 evidence is mixed — only a small fraction of the most-cited domains use one, and major engines do not appear to rely on it. Publishing one is cheap and harmless, but prioritize FAQ content and answer capsules first; they deliver far higher citation ROI.",
    }));
  }

  // nosnippet directive — Critical: directly blocks AI extraction (Zyppy Signal score 9.2/10)
  if (ctx.hasNoSnippet) {
    recs.push(composeRec("nosnippet-directive", {
      detail: "A nosnippet or max-snippet:0 directive was found in your meta robots tag or x-robots-tag HTTP header. This explicitly instructs AI engines not to extract content from your page, making citation impossible regardless of how good your content is. Remove the nosnippet value from the robots tag — if you need to block traditional featured snippets for specific pages, use max-snippet with a positive value instead.",
      priority: "critical",
    }));
  }

  // Content placement — fires when key content is buried (Zyppy Signal score 8.8/10)
  if ((ctx.contentPlacementScore ?? 50) < 40) {
    recs.push(composeRec("content-placement", {
      detail: `Content placement score: ${ctx.contentPlacementScore ?? "unknown"}/100 — your primary answer appears well into the page rather than near the top. AI engines like Gemini apply per-URL retrieval caps, meaning content beyond the first 250–500 words is often not extracted at all. Move your core answer, definition, or key takeaway to the very top of your main content area — ideally the first paragraph after your H1 — before any preamble, disclaimers, or contextual build-up.`,
      priority: (ctx.contentPlacementScore ?? 50) < 20 ? "high" : "medium",
    }));
  }

  if (ctx.blockedAiCrawlers.length > 0) {
    recs.push(composeRec("unblock-crawlers", {
      detail: `Blocked in robots.txt: ${ctx.blockedAiCrawlers.join(", ")}. If you want to be cited by these engines, allow their user agents.`,
      priority: ctx.blockedAiCrawlers.length >= 3 ? "high" : "medium",
    }));
  }

  if (ctx.avgCitabilityScore < 50) {
    recs.push(composeRec("passage-restructure", {
      // Title comes from the catalog ("Restructure passages into self-contained
      // answers"). We deliberately do NOT cite the prior "134-167 words" range
      // here — it was a private internal-benchmark observation and is now
      // documented qualitatively on the /methodology page rather than
      // promised as a precise number in the user-facing rec.
      detail: `Average passage citability is ${Math.round(ctx.avgCitabilityScore)}/100. Restructure each passage so it opens with a definition or direct answer and stands alone without surrounding context — every chunk should be quotable on its own. (For our methodology and audited-corpus benchmarks, see /methodology.)`,
    }));
  }

  // Sort by priority
  const order: Record<RecPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  recs.sort((a, b) => order[a.priority] - order[b.priority]);
  return recs;
}
