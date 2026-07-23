import * as cheerio from "cheerio";
import { analyzeBrandAuthority, type BrandSignal } from "./brandAuthority";
import { extractContentSignals, generateGeoRecommendations, type GeoRecommendation } from "./geoRecommendations";
import { renderPage } from "./pageRenderer";
import { safeFetch } from "./safeFetch";
import { isAllowedByRobots, parseRobotsTxt } from "./robotsPolicy";
export { isAllowedByRobots, parseRobotsTxt } from "./robotsPolicy";

export interface CrawlerStatus {
  name: string;
  allowed: boolean;
  type: string;
}

export interface CitabilityBlock {
  heading: string | null;
  wordCount: number;
  score: number;
  grade: string;
  preview: string;
}

export interface SchemaItem {
  type: string;
  present: boolean;
  properties?: string[];
}

export interface PlatformScore {
  platform: string;
  score: number;
  status: string;
  recommendations: string[];
}

export interface GeoScores {
  citability: number;
  brandAuthority: number;
  aiCrawlerAccess: number;
  technicalSeo: number;
  structuredData: number;
  platformOptimization: number;
}

export interface AnalysisResult {
  url: string;
  title: string | null;
  description: string | null;
  geoScore: number;
  scores: GeoScores;
  crawlers: CrawlerStatus[];
  citabilityBlocks: CitabilityBlock[];
  avgCitabilityScore: number;
  schemaTypes: SchemaItem[];
  platforms: PlatformScore[];
  quickWins: string[];
  technicalIssues: string[];
  hasLlmsTxt: boolean;
  hasHttps: boolean;
  hasCanonical: boolean;
  /** True when a nosnippet directive was found in meta robots or x-robots-tag header. */
  hasNoSnippet: boolean;
  wordCount: number;
  rawHtmlWordCount: number;
  renderedWordCount: number;
  requiresJavaScript: boolean;
  renderedSuccessfully: boolean;
  /**
   * 0-100 score measuring how early the first substantive content block appears
   * relative to total page length. Higher = better (answer is near the top).
   * Based on Zyppy Signal's Content Placement factor (score 8.8/10).
   */
  contentPlacementScore: number;
  brandName: string;
  brandSignals: BrandSignal[];
  recommendations: GeoRecommendation[];
  pageExcerpt?: string;
  topHeadings?: string[];
}

// The 2026 crawler landscape distinguishes three bot roles per vendor, and
// the distinction is what users actually need to act on:
//   search   — builds the index AI answers cite from. Blocking one of these
//              removes the site from that engine's citations. (OpenAI docs
//              explicitly support allowing OAI-SearchBot while blocking
//              GPTBot.)
//   fetch    — user-initiated live retrieval (a user asks about your page /
//              clicks a citation). Blocking breaks those lookups.
//   training — foundation-model training corpora only. Blocking is a
//              legitimate IP choice and does NOT remove citations, so
//              training-bot blocks are surfaced as info, never as a
//              technical issue.
// Note: Google AI Overviews are fed by regular Googlebot; Google-Extended
// only opts out of Gemini training. The old "GoogleBot-AI" label implied
// the opposite.
export type CrawlerRole = "search" | "fetch" | "training";

const AI_CRAWLERS: { name: string; agent: string; type: string; role: CrawlerRole }[] = [
  { name: "OAI-SearchBot", agent: "oai-searchbot", type: "OpenAI · ChatGPT Search index", role: "search" },
  { name: "ChatGPT-User", agent: "chatgpt-user", type: "OpenAI · live fetch for ChatGPT users", role: "fetch" },
  { name: "GPTBot", agent: "gptbot", type: "OpenAI · model training", role: "training" },
  { name: "Claude-SearchBot", agent: "claude-searchbot", type: "Anthropic · Claude search index", role: "search" },
  { name: "Claude-User", agent: "claude-user", type: "Anthropic · live fetch for Claude users", role: "fetch" },
  { name: "ClaudeBot", agent: "claudebot", type: "Anthropic · model training", role: "training" },
  { name: "PerplexityBot", agent: "perplexitybot", type: "Perplexity · search index", role: "search" },
  { name: "Perplexity-User", agent: "perplexity-user", type: "Perplexity · live fetch for users", role: "fetch" },
  { name: "Google-Extended", agent: "google-extended", type: "Google · Gemini training opt-out (AI Overviews use regular Googlebot)", role: "training" },
  { name: "BingBot", agent: "bingbot", type: "Microsoft · Bing index (feeds Copilot)", role: "search" },
  { name: "Applebot", agent: "applebot", type: "Apple · Siri & Apple Intelligence", role: "search" },
  { name: "meta-externalagent", agent: "meta-externalagent", type: "Meta · model training", role: "training" },
];

const CRAWLER_ROLE_BY_NAME = new Map(AI_CRAWLERS.map((c) => [c.name, c.role]));

// "Mentions a recent year" citability signal — computed from the clock so it
// doesn't silently rot (the old literal regex capped at 2026).
const CURRENT_YEAR = new Date().getFullYear();
const RECENT_YEAR_RE = new RegExp(
  `\\b(?:${Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - i).join("|")})\\b`,
);

function scorePassage(text: string, heading: string | null = null): CitabilityBlock {
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  let total = 0;

  // Answer block quality (30%)
  let abq = 0;
  if (/\b\w+\s+is\s+(?:a|an|the)\s|\b\w+\s+refers?\s+to\s|\b\w+\s+means?\s/i.test(text)) abq += 15;
  if (/\b(?:is|are|was|were|means?|refers?)\b|\d+%|\$[\d,]+/i.test(words.slice(0, 60).join(" "))) abq += 15;
  if (heading?.endsWith("?")) abq += 10;
  const sentences = text.split(/[.!?]+/);
  const shortSentences = sentences.filter(s => { const w = s.trim().split(/\s+/).length; return w >= 5 && w <= 25; }).length;
  if (sentences.length > 0) abq += Math.round((shortSentences / sentences.length) * 10);
  if (/according to|research shows|studies? (?:show|indicate|found)/i.test(text)) abq += 10;
  total += Math.min(abq, 30);

  // Self-containment (25%)
  let sc = 0;
  if (wordCount >= 134 && wordCount <= 167) sc += 10;
  else if (wordCount >= 100 && wordCount <= 200) sc += 7;
  else if (wordCount >= 80 && wordCount <= 250) sc += 4;
  else if (wordCount >= 30) sc += 2;
  const pronouns = (text.match(/\b(?:it|they|them|their|this|that|these|those|he|she|his|her)\b/gi) || []).length;
  const pronRatio = wordCount > 0 ? pronouns / wordCount : 1;
  if (pronRatio < 0.02) sc += 8;
  else if (pronRatio < 0.04) sc += 5;
  else if (pronRatio < 0.06) sc += 3;
  const properNouns = (text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []).length;
  if (properNouns >= 3) sc += 7;
  else if (properNouns >= 1) sc += 4;
  total += Math.min(sc, 25);

  // Structural readability (20%)
  let sr = 0;
  if (sentences.length > 0) {
    const avg = wordCount / sentences.length;
    if (avg >= 10 && avg <= 20) sr += 8;
    else if (avg >= 8 && avg <= 25) sr += 5;
    else sr += 2;
  }
  if (/first|second|third|finally|additionally|moreover/i.test(text)) sr += 4;
  if (/\d+[.)]\s|\bstep\s+\d+/i.test(text)) sr += 4;
  if (text.includes("\n")) sr += 4;
  total += Math.min(sr, 20);

  // Statistical density (15%)
  let sd = 0;
  sd += Math.min(((text.match(/\d+(?:\.\d+)?%/g) || []).length) * 3, 6);
  sd += Math.min(((text.match(/\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|M|B|K))?/g) || []).length) * 3, 5);
  if (/(according to|per|from|by)\s+[A-Z]|Gartner|Forrester|McKinsey|Google|Microsoft|OpenAI|Anthropic/g.test(text)) sd += 2;
  if (RECENT_YEAR_RE.test(text)) sd += 2;
  total += Math.min(sd, 15);

  // Uniqueness signals (10%)
  let us = 0;
  if (/our (?:research|study|data|analysis|survey)|we (?:found|discovered|analyzed)/i.test(text)) us += 5;
  if (/case study|for example|for instance|in practice|real-world/i.test(text)) us += 3;
  if (/(?:using|with|via|through)\s+[A-Z][a-z]+/.test(text)) us += 2;
  total += Math.min(us, 10);

  let grade: string;
  if (total >= 80) grade = "A";
  else if (total >= 65) grade = "B";
  else if (total >= 50) grade = "C";
  else if (total >= 35) grade = "D";
  else grade = "F";

  return {
    heading,
    wordCount,
    score: total,
    grade,
    preview: words.slice(0, 30).join(" ") + (wordCount > 30 ? "..." : ""),
  };
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const parsedUrl = new URL(url);
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
  const hasHttps = parsedUrl.protocol === "https:";

  const headers = {
    "User-Agent": "Mozilla/5.0 (compatible; GEOSEOAnalyzer/1.0)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  let rawHtml = "";
  let renderedHtml = "";
  let title: string | null = null;
  let ogSiteName: string | null = null;
  let description: string | null = null;
  let hasCanonical = false;
  let hasNoSnippet = false;
  let hasNoIndex = false;
  let wordCount = 0;
  let contentPlacementScore = 50;
  let rawHtmlWordCount = 0;
  let renderedWordCount = 0;
  let renderedSuccessfully = false;
  let rawFetchSucceeded = false;
  let structuredDataTypes: SchemaItem[] = [];
  let orgSchemaName: string | null = null;
  let citabilityBlocks: CitabilityBlock[] = [];
  let $page: cheerio.CheerioAPI | null = null;

  // Kick off ALL independent network I/O concurrently — the raw fetch,
  // browser render, robots.txt, and llms.txt have no data dependencies on
  // each other. The old flow awaited them one after another, adding their
  // latencies together on every audit.
  const rawFetchPromise = safeFetch(url, { headers, timeoutMs: 15000, maxBytes: 8 * 1024 * 1024 });
  const renderPromise = renderPage(url).catch(() => null);
  const robotsPromise = safeFetch(`${baseUrl}/robots.txt`, {
    headers,
    timeoutMs: 10000,
    maxBytes: 512 * 1024,
  })
    .then((r) => r.text())
    .catch(() => "");
  // Validate llms.txt content, not just HTTP 200 — SPA catch-all routes
  // serve index.html for ANY path, which previously counted as "has
  // llms.txt" (a false positive that inflated two scores).
  const llmsPromise = safeFetch(`${baseUrl}/llms.txt`, {
    headers,
    timeoutMs: 8000,
    maxBytes: 256 * 1024,
  })
    .then(async (r) => {
      if (!r.ok) return false;
      const ct = (r.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("html")) return false;
      const body = (await r.text()).trimStart();
      return body.length > 0 && !body.startsWith("<");
    })
    .catch(() => false);
  // Sitemap presence: AI search indexers (OAI-SearchBot, Claude-SearchBot,
  // PerplexityBot, Bingbot) use sitemaps for discovery and freshness. A
  // robots.txt "Sitemap:" directive pointing elsewhere also counts — checked
  // after the robots fetch resolves.
  const sitemapPromise = safeFetch(`${baseUrl}/sitemap.xml`, {
    headers,
    timeoutMs: 8000,
    maxBytes: 128 * 1024,
  })
    .then(async (r) => {
      if (!r.ok) return false;
      const body = (await r.text()).trimStart().toLowerCase();
      return body.startsWith("<?xml") || body.includes("<urlset") || body.includes("<sitemapindex");
    })
    .catch(() => false);

  // 1) Fetch raw HTML (this is what AI crawlers without JS see)
  try {
    const response = await rawFetchPromise;
    if (response.ok) {
      const ct = (response.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("html") || ct === "" || ct.includes("xml")) {
        rawHtml = await response.text();
        rawFetchSucceeded = true;
        const $raw = cheerio.load(rawHtml);
        $raw("script, style, noscript").remove();
        const rawText = $raw("body").text().replace(/\s+/g, " ").trim();
        rawHtmlWordCount = rawText.split(/\s+/).filter(Boolean).length;
      }
      // Check x-robots-tag HTTP header for nosnippet / noindex directives
      const xRobotsTag = response.headers.get("x-robots-tag") || "";
      if (/nosnippet|max-snippet\s*:\s*0\b/i.test(xRobotsTag)) {
        hasNoSnippet = true;
      }
      if (/\bnoindex\b/i.test(xRobotsTag)) {
        hasNoIndex = true;
      }
    }
  } catch {}

  // 2) Rendered content (already in flight, kicked off above)
  try {
    const rendered = await renderPromise;
    if (rendered) {
      renderedHtml = rendered.html;
      renderedWordCount = rendered.visibleText.split(/\s+/).filter(Boolean).length;
      renderedSuccessfully = true;
    }
  } catch {}

  // Use rendered HTML for analysis when available; fall back to raw HTML.
  const analysisHtml = renderedHtml || rawHtml;

  if (analysisHtml) {
    try {
      const $ = cheerio.load(analysisHtml);
      $page = $;

      title = $("title").first().text().trim() || null;
      description =
        $("meta[name='description']").attr("content") ||
        $("meta[property='og:description']").attr("content") ||
        null;
      ogSiteName =
        ($("meta[property='og:site_name']").attr("content") || "").trim() ||
        ($("meta[name='application-name']").attr("content") || "").trim() ||
        null;
      hasCanonical = $("link[rel='canonical']").length > 0;

      // Detect nosnippet / preview-restriction directives in meta robots tags.
      // Per Zyppy Signal AI Citation Ranking Factors: Preview Controls scores 9.2/10.
      // nosnippet or max-snippet:0 / max-snippet:-1 block AI extraction entirely.
      $("meta[name='robots'], meta[name='googlebot']").each((_, el) => {
        const content = ($(el).attr("content") || "").toLowerCase();
        if (/\bnosnippet\b/.test(content) || /max-snippet\s*:\s*0\b/.test(content)) {
          hasNoSnippet = true;
        }
        if (/\bnoindex\b/.test(content)) {
          hasNoIndex = true;
        }
      });

      // Detect schema types from raw HTML (JSON-LD is server-rendered for SEO)
      const $forSchema = cheerio.load(rawHtml || analysisHtml);
      const schemaScripts = $forSchema("script[type='application/ld+json']");
      const detectedTypes = new Set<string>();
      schemaScripts.each((_, el) => {
        try {
          const data = JSON.parse($forSchema(el).html() || "{}");
          // Flatten one level of @graph — Yoast/WordPress and most SEO
          // plugins wrap every entity in {"@context": ..., "@graph": [...]},
          // which the old parser read as a single untyped object. That made
          // a huge class of well-marked-up sites report zero schema.
          const topLevel = Array.isArray(data) ? data : [data];
          const items: any[] = [];
          for (const entry of topLevel) {
            if (!entry || typeof entry !== "object") continue;
            items.push(entry);
            if (Array.isArray(entry["@graph"])) items.push(...entry["@graph"]);
          }
          for (const item of items) {
            if (!item || typeof item !== "object") continue;
            const types = ([] as string[]).concat(item["@type"] || []);
            for (const t of types) if (t) detectedTypes.add(String(t));
            // Extract Organization-like entity name for brand-authority alt-name lookups
            if (
              types.some((t: string) => /^(Organization|LocalBusiness|Corporation|Brand|WebSite)$/i.test(String(t))) &&
              typeof item.name === "string" && item.name.trim().length >= 2
            ) {
              if (!orgSchemaName) orgSchemaName = item.name.trim();
            }
          }
        } catch {}
      });
      const schemaChecks = ["Organization", "LocalBusiness", "Article", "Product", "WebSite", "FAQPage", "HowTo", "BreadcrumbList"];
      structuredDataTypes = schemaChecks.map((type) => ({ type, present: detectedTypes.has(type) }));

      // Extract text and score citability
      $("script, style, nav, footer, header, aside, form").remove();
      const contentBlocks: { heading: string | null; content: string }[] = [];
      let currentHeading: string | null = "Introduction";
      let currentParas: string[] = [];

      $("h1, h2, h3, h4, p, ul, ol").each((_, el) => {
        const tagName = (el as any).tagName?.toLowerCase();
        if (["h1", "h2", "h3", "h4"].includes(tagName)) {
          if (currentParas.length > 0) {
            const combined = currentParas.join(" ");
            if (combined.split(/\s+/).length >= 20) {
              contentBlocks.push({ heading: currentHeading, content: combined });
            }
          }
          currentHeading = $(el).text().trim();
          currentParas = [];
        } else {
          const text = $(el).text().trim();
          if (text && text.split(/\s+/).length >= 5) {
            currentParas.push(text);
          }
        }
      });
      if (currentParas.length > 0) {
        const combined = currentParas.join(" ");
        if (combined.split(/\s+/).length >= 20) {
          contentBlocks.push({ heading: currentHeading, content: combined });
        }
      }

      citabilityBlocks = contentBlocks.map((b) => scorePassage(b.content, b.heading));
      const allText = $("body").text().replace(/\s+/g, " ").trim();
      const analyzedWordCount = allText.split(/\s+/).filter(Boolean).length;

      // Content placement score: measures how early the first substantive content block
      // appears relative to total body length. Per Zyppy Signal (score 8.8/10), AI engines
      // — particularly Gemini — apply per-URL retrieval caps, so above-fold content is
      // far more likely to be extracted and cited.
      if (contentBlocks.length > 0 && allText.length > 0) {
        // Plain indexOf, not a regex built from page content: escaping a
        // slice of the page could split an escape sequence into an invalid
        // pattern (throwing away the whole analysis block), and a failed
        // match previously fell through to wordsBeforeFirst=0 — scoring
        // deeply-buried content a perfect 100. On no-match we now leave the
        // neutral default (50) instead of fabricating a best case.
        const firstBlockPreview = contentBlocks[0].content.slice(0, 40);
        const matchIdx = allText.indexOf(firstBlockPreview);
        const totalWords = allText.split(/\s+/).filter(Boolean).length;
        if (matchIdx >= 0 && totalWords > 0) {
          const wordsBeforeFirst = matchIdx > 0
            ? allText.slice(0, matchIdx).split(/\s+/).filter(Boolean).length
            : 0;
          const placementPct = wordsBeforeFirst / totalWords;
          // 100 = answer in first 5% of page; 50 = at 25%; 0 = at 50%+
          contentPlacementScore = Math.max(0, Math.round(100 - placementPct * 200));
        }
      }
      // Prefer the rendered word count if rendering succeeded
      wordCount = renderedSuccessfully ? Math.max(renderedWordCount, analyzedWordCount) : analyzedWordCount;
    } catch {}
  }

  // SPA detection: rendered content is dramatically larger than raw HTML.
  // Only meaningful when BOTH passes succeeded — otherwise we can't compare.
  const requiresJavaScript =
    renderedSuccessfully &&
    rawFetchSucceeded &&
    renderedWordCount >= 100 &&
    (rawHtmlWordCount < 50 || renderedWordCount > rawHtmlWordCount * 4);

  // Check robots.txt (fetched concurrently above)
  const crawlerStatuses: CrawlerStatus[] = [];
  const robotsTxt = await robotsPromise;

  const rules = parseRobotsTxt(robotsTxt);
  for (const crawler of AI_CRAWLERS) {
    crawlerStatuses.push({
      name: crawler.name,
      allowed: isAllowedByRobots(rules, crawler.agent, parsedUrl.pathname || "/"),
      type: crawler.type,
    });
  }

  // Check llms.txt and sitemap.xml (fetched concurrently above). A
  // robots.txt "Sitemap:" directive pointing at a non-default path also
  // counts as having a sitemap.
  const hasLlmsTxt = await llmsPromise;
  const hasSitemap = (await sitemapPromise) || /^\s*sitemap\s*:/im.test(robotsTxt);

  // Calculate scores
  const avgCitabilityScore = citabilityBlocks.length > 0
    ? citabilityBlocks.reduce((sum, b) => sum + b.score, 0) / citabilityBlocks.length
    : 0;

  // Blocked-crawler impact is role-specific: blocking a SEARCH indexer or a
  // user-initiated FETCH bot removes the site from citations; blocking a
  // TRAINING bot is a legitimate IP choice with no citation impact.
  const blockedSearchBots = crawlerStatuses.filter(
    (c) => !c.allowed && CRAWLER_ROLE_BY_NAME.get(c.name) === "search",
  );
  const blockedFetchBots = crawlerStatuses.filter(
    (c) => !c.allowed && CRAWLER_ROLE_BY_NAME.get(c.name) === "fetch",
  );

  // Structured-data score: weighted by how much each type matters for AI
  // extraction, capped at 100. The old formula divided by ALL 8 checked
  // types, so a perfectly-marked-up blog post (no Product/LocalBusiness)
  // could never pass ~60 — structurally deflated for every page type.
  // FAQPage weighs heaviest: it is the schema type most directly correlated
  // with AI citation (engines lift pre-structured Q&A pairs verbatim).
  const present = new Set(structuredDataTypes.filter((s) => s.present).map((s) => s.type));
  const schemaWeights: Record<string, number> = {
    Organization: 25,
    LocalBusiness: 25, // alternative to Organization for local brands
    WebSite: 15,
    FAQPage: 30,
    Article: 20,
    Product: 20,
    HowTo: 15,
    BreadcrumbList: 10,
  };
  let schemaPoints = 0;
  let orgCounted = false;
  for (const [type, pts] of Object.entries(schemaWeights)) {
    if (!present.has(type)) continue;
    if (type === "Organization" || type === "LocalBusiness") {
      if (orgCounted) continue; // don't double-count identity schema
      orgCounted = true;
    }
    schemaPoints += pts;
  }
  const schemaScore = Math.min(100, schemaPoints);

  // Technical SEO score
  const technicalIssues: string[] = [];
  const quickWins: string[] = [];
  let technicalScore = 60;

  if (hasHttps) technicalScore += 10;
  else { technicalIssues.push("Site not using HTTPS"); quickWins.push("Migrate to HTTPS"); }

  if (hasCanonical) technicalScore += 10;
  else { technicalIssues.push("No canonical tag found"); quickWins.push("Add canonical tags to prevent duplicate content"); }

  // noindex removes the page from EVERY search index — including the AI
  // search indexes (ChatGPT Search, Claude search, Perplexity, AI
  // Overviews) that answer engines cite from. Nothing else on this page
  // matters until it's gone.
  if (hasNoIndex) {
    technicalIssues.push(
      "CRITICAL: A noindex directive (meta robots or x-robots-tag) removes this page from search indexes — including the indexes AI engines cite from. No optimization matters until this is removed.",
    );
    quickWins.push("Remove the noindex directive — it makes this page invisible to AI search engines");
    technicalScore -= 25;
  }

  // nosnippet / max-snippet:0 forbids engines from quoting the page — AI
  // answers can't excerpt or cite content they're not allowed to display.
  if (hasNoSnippet) {
    technicalIssues.push(
      "CRITICAL: A nosnippet / max-snippet:0 directive forbids AI engines from quoting this page. Engines cannot cite content they're not allowed to display — this blocks citations outright.",
    );
    quickWins.push("Remove the nosnippet / max-snippet:0 directive so AI engines can quote and cite your content");
    technicalScore -= 15;
  }

  if (requiresJavaScript) {
    technicalIssues.push(
      `Page requires JavaScript to render content (raw HTML: ${rawHtmlWordCount} words, rendered: ${renderedWordCount} words). AI search crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot) do not execute JavaScript and will see almost nothing.`
    );
    quickWins.push(
      "Add server-side rendering (SSR), static prerendering, or dynamic rendering for AI crawler user-agents — your client-side content is invisible to AI search engines"
    );
    technicalScore -= 15;
  } else if (!renderedSuccessfully) {
    technicalIssues.push(
      "JavaScript-rendered analysis was unavailable — SPA detection may be incomplete and the word count reflects only the raw HTML response."
    );
  }
  if (wordCount < 300) { technicalIssues.push(`Low word count (${wordCount} words) — AI models prefer content-rich pages`); }
  if (wordCount > 3000) technicalScore += 10;

  // Per-engine consequence of blocked citation-path bots. Named engine by
  // engine so the user knows exactly what they're losing — a blanket
  // "crawlers blocked" line wasn't actionable.
  if (blockedSearchBots.length > 0) {
    const parts = blockedSearchBots.map((c) => `${c.name} (${c.type.split("·")[0].trim()})`).join(", ");
    technicalIssues.push(
      `AI search indexers blocked in robots.txt: ${parts}. These build the indexes AI answers cite from — blocking them removes this site from those engines' citations.`,
    );
    quickWins.push(
      `Allow AI search indexers in robots.txt (${blockedSearchBots.map((c) => c.name).join(", ")}) — they control whether you can be cited at all`,
    );
  }
  if (blockedFetchBots.length > 0) {
    technicalIssues.push(
      `User-request fetchers blocked in robots.txt: ${blockedFetchBots.map((c) => c.name).join(", ")}. When someone asks an AI assistant about this site (or clicks a citation), the assistant can't open the page.`,
    );
  }

  // Sitemap: AI search indexers use it for discovery and freshness detection.
  if (!hasSitemap) {
    technicalIssues.push(
      "No sitemap.xml found (and robots.txt declares none) — AI search indexers rely on sitemaps for page discovery and freshness signals.",
    );
    quickWins.push("Publish a sitemap.xml and reference it from robots.txt");
  } else {
    technicalScore += 8;
  }

  // llms.txt: kept as a small bonus, not a headline recommendation.
  // Current crawler-log evidence (2026) shows major AI crawlers almost
  // never fetch it and no engine has committed to reading it — it's a
  // cheap, harmless extra, not a citation lever, so it no longer earns a
  // quick-win slot or a large score share.
  if (hasLlmsTxt) technicalScore += 2;

  if (schemaScore < 25) {
    quickWins.push("Add structured data (Organization, Article, FAQ schemas) to improve AI discoverability");
  }

  if (!description) { technicalIssues.push("Missing meta description"); quickWins.push("Add a compelling meta description (150-160 chars)"); }
  if (!title) { technicalIssues.push("Missing title tag"); quickWins.push("Add a descriptive title tag"); }

  if (avgCitabilityScore < 40) {
    quickWins.push("Restructure content into self-contained 134-167 word passages with clear answers");
  }

  technicalScore = Math.max(0, Math.min(100, technicalScore));

  const citabilityScore = Math.min(100, Math.round(avgCitabilityScore * 1.2));
  const contentQualityScore = Math.min(100, Math.round(
    (wordCount > 1000 ? 40 : wordCount / 25) +
    (description ? 15 : 0) +
    (title ? 10 : 0) +
    (citabilityBlocks.filter(b => b.grade === "A" || b.grade === "B").length * 3)
  ));
  const citationPathBots = crawlerStatuses.filter((c) => CRAWLER_ROLE_BY_NAME.get(c.name) !== "training");
  const allowedCitationBots = citationPathBots.filter((c) => c.allowed).length;
  const aiCrawlerAccessScore = Math.max(0, Math.min(100, Math.round(
    (citationPathBots.length ? allowedCitationBots / citationPathBots.length : 1) * 70 +
    (hasNoIndex ? 0 : 15) +
    (hasNoSnippet ? 0 : 10) +
    (requiresJavaScript ? 0 : 5)
  )));

  // Platform scores — each keyed to the bot that actually gates CITATIONS
  // on that platform: OAI-SearchBot feeds ChatGPT Search (GPTBot is
  // training-only), Claude-SearchBot feeds Claude's search answers, and
  // AI Overviews are fed by ordinary Googlebot (Google-Extended is a
  // Gemini-training opt-out, so it doesn't gate Overview eligibility).
  const botAllowed = (name: string) => crawlerStatuses.find((c) => c.name === name)?.allowed ?? true;
  const platforms: PlatformScore[] = [
    {
      platform: "ChatGPT / OpenAI",
      score: Math.round((botAllowed("OAI-SearchBot") ? 50 : 10) + citabilityScore * 0.3 + schemaScore * 0.2),
      status: botAllowed("OAI-SearchBot") ? "Crawler allowed" : "Crawler blocked",
      recommendations: ["Allow OAI-SearchBot (ChatGPT Search index) and ChatGPT-User in robots.txt", "Use FAQ schema for Q&A content", "Include citations and statistics"],
    },
    {
      platform: "Claude / Anthropic",
      score: Math.round((botAllowed("Claude-SearchBot") ? 50 : 10) + citabilityScore * 0.3 + contentQualityScore * 0.2),
      status: botAllowed("Claude-SearchBot") ? "Crawler allowed" : "Crawler blocked",
      recommendations: ["Allow Claude-SearchBot and Claude-User in robots.txt", "Focus on E-E-A-T signals", "Create comprehensive topic clusters"],
    },
    {
      platform: "Perplexity",
      score: Math.round((botAllowed("PerplexityBot") ? 50 : 10) + citabilityScore * 0.35 + contentQualityScore * 0.15),
      status: botAllowed("PerplexityBot") ? "Crawler allowed" : "Crawler blocked",
      recommendations: ["Allow PerplexityBot and Perplexity-User in robots.txt", "Provide factual, citation-ready content", "Link to authoritative sources"],
    },
    {
      platform: "Google AI Overviews",
      score: Math.round(technicalScore * 0.4 + citabilityScore * 0.3 + schemaScore * 0.3),
      status: hasNoIndex ? "Blocked" : hasHttps ? "Eligible" : "At Risk",
      recommendations: ["AI Overviews source from the regular Google index — keep Googlebot allowed and rankings strong", "Use HowTo and FAQ schemas", "Build topical authority with comprehensive coverage"],
    },
  ];

  // Real brand authority via Wikipedia, DuckDuckGo, GitHub
  const hasOrgSchema = structuredDataTypes.some(
    (s) => s.present && (s.type === "Organization" || s.type === "LocalBusiness")
  );
  const hasFaqSchema = structuredDataTypes.some((s) => s.present && s.type === "FAQPage");
  const hasArticleSchema = structuredDataTypes.some((s) => s.present && s.type === "Article");
  const hasHowToSchema = structuredDataTypes.some((s) => s.present && s.type === "HowTo");
  const brandAuthority = await analyzeBrandAuthority(url, title, hasOrgSchema, orgSchemaName, ogSiteName);

  // Generate prioritized GEO recommendations from extracted content signals.
  // Source attribution for each recommendation lives in the @workspace/recommendations
  // catalog and is composed in by composeRec() in geoRecommendations.ts.
  // Only citation-path bots (search indexers + user-request fetchers) feed
  // the unblock-crawlers recommendation — a deliberate training-bot block
  // shouldn't generate "unblock" advice.
  const blockedAiCrawlers = [...blockedSearchBots, ...blockedFetchBots].map((c) => c.name);
  let recommendations: GeoRecommendation[] = [];
  if ($page) {
    const signals = extractContentSignals($page, url, brandAuthority.brandName || null, wordCount);
    recommendations = generateGeoRecommendations({
      signals,
      hasFaqSchema,
      hasArticleSchema,
      hasOrgSchema,
      hasHowToSchema,
      hasLlmsTxt,
      brandName: brandAuthority.brandName || null,
      brandFound: brandAuthority.signals.some((s) => s.found),
      blockedAiCrawlers,
      avgCitabilityScore,
      hasNoSnippet,
      contentPlacementScore,
    });
  }

  const scores: GeoScores = {
    citability: citabilityScore,
    brandAuthority: brandAuthority.score,
    aiCrawlerAccess: aiCrawlerAccessScore,
    technicalSeo: technicalScore,
    structuredData: schemaScore,
    platformOptimization: Math.round(platforms.reduce((sum, p) => sum + p.score, 0) / platforms.length),
  };

  // Weighted GEO score (matches the repo's methodology)
  const geoScore = Math.round(
    scores.citability * 0.25 +
    scores.brandAuthority * 0.20 +
    scores.aiCrawlerAccess * 0.20 +
    scores.technicalSeo * 0.15 +
    scores.structuredData * 0.10 +
    scores.platformOptimization * 0.10
  );

  return {
    url,
    title,
    description,
    geoScore,
    scores,
    crawlers: crawlerStatuses,
    citabilityBlocks: citabilityBlocks.slice(0, 10),
    avgCitabilityScore: Math.round(avgCitabilityScore * 10) / 10,
    schemaTypes: structuredDataTypes,
    platforms,
    quickWins: mergeQuickWins(quickWins, recommendations).slice(0, 8),
    technicalIssues: technicalIssues.slice(0, 6),
    hasLlmsTxt,
    hasHttps,
    hasCanonical,
    hasNoSnippet,
    wordCount,
    rawHtmlWordCount,
    renderedWordCount,
    requiresJavaScript,
    renderedSuccessfully,
    contentPlacementScore,
    brandName: brandAuthority.brandName,
    brandSignals: brandAuthority.signals,
    recommendations,
    pageExcerpt: $page
      ? $page("body").text().replace(/\s+/g, " ").trim().slice(0, 1500)
      : undefined,
    topHeadings: $page
      ? $page("h1, h2, h3")
          .map((_, el) => $page!(el).text().trim())
          .get()
          .filter((t) => t.length > 0 && t.length < 200)
          .slice(0, 10)
      : undefined,
  };
}

function mergeQuickWins(existing: string[], recs: GeoRecommendation[]): string[] {
  const seen = new Set(existing.map((s) => s.toLowerCase()));
  const out = [...existing];
  for (const r of recs) {
    if (r.priority !== "critical" && r.priority !== "high") continue;
    const line = `${r.title} — ${r.impact}`;
    if (!seen.has(line.toLowerCase())) {
      out.push(line);
      seen.add(line.toLowerCase());
    }
  }
  return out;
}
