import * as cheerio from "cheerio";
import { analyzeBrandAuthority, type BrandSignal } from "./brandAuthority";
import { extractContentSignals, generateGeoRecommendations, type GeoRecommendation } from "./geoRecommendations";
import { renderPage } from "./pageRenderer";
import { safeFetch } from "./safeFetch";

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
  contentQuality: number;
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

const AI_CRAWLERS = [
  { name: "GPTBot", agent: "gptbot", type: "OpenAI" },
  { name: "ClaudeBot", agent: "claudebot", type: "Anthropic" },
  { name: "PerplexityBot", agent: "perplexitybot", type: "Perplexity" },
  { name: "GoogleBot-AI", agent: "google-extended", type: "Google AI" },
  { name: "BingBot", agent: "bingbot", type: "Microsoft" },
  { name: "YouBot", agent: "youbot", type: "You.com" },
  { name: "Applebot", agent: "applebot", type: "Apple" },
  { name: "meta-externalagent", agent: "meta-externalagent", type: "Meta" },
];

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
  if (/\b20(?:2[3-6]|1\d)\b/.test(text)) sd += 2;
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

function parseRobotsTxt(robotsTxt: string): Map<string, boolean> {
  const rules = new Map<string, boolean>();
  const lines = robotsTxt.split("\n").map(l => l.trim());
  let currentAgent = "";
  let applies = false;

  for (const line of lines) {
    if (line.toLowerCase().startsWith("user-agent:")) {
      currentAgent = line.split(":")[1]?.trim().toLowerCase() || "";
      applies = currentAgent === "*" || AI_CRAWLERS.some(c => c.agent === currentAgent);
    } else if (applies && line.toLowerCase().startsWith("disallow:")) {
      const path = line.split(":")[1]?.trim();
      if (path === "/" || path === "") {
        rules.set(currentAgent, path === "/");
      }
    } else if (applies && line.toLowerCase().startsWith("allow:")) {
      const path = line.split(":")[1]?.trim();
      if (path === "/" || path === "") {
        rules.set(currentAgent, false);
      }
    }
  }
  return rules;
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

  // 1) Fetch raw HTML (this is what AI crawlers without JS see)
  try {
    const response = await safeFetch(url, { headers, timeoutMs: 15000, maxBytes: 8 * 1024 * 1024 });
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
      // Check x-robots-tag HTTP header for nosnippet directive
      const xRobotsTag = response.headers.get("x-robots-tag") || "";
      if (/nosnippet|max-snippet\s*:\s*0\b/i.test(xRobotsTag)) {
        hasNoSnippet = true;
      }
    }
  } catch {}

  // 2) Try rendering with a real browser to capture client-side content
  try {
    const rendered = await renderPage(url);
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
      if (!hasNoSnippet) {
        $("meta[name='robots'], meta[name='googlebot']").each((_, el) => {
          const content = ($(el).attr("content") || "").toLowerCase();
          if (/\bnosnippet\b/.test(content) || /max-snippet\s*:\s*0\b/.test(content)) {
            hasNoSnippet = true;
          }
        });
      }

      // Detect schema types from raw HTML (JSON-LD is server-rendered for SEO)
      const $forSchema = cheerio.load(rawHtml || analysisHtml);
      const schemaScripts = $forSchema("script[type='application/ld+json']");
      const detectedTypes = new Set<string>();
      schemaScripts.each((_, el) => {
        try {
          const data = JSON.parse($forSchema(el).html() || "{}");
          const items = Array.isArray(data) ? data : [data];
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
        const firstBlockPreview = contentBlocks[0].content.slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const matchIdx = allText.search(new RegExp(firstBlockPreview.slice(0, 40)));
        const wordsBeforeFirst = matchIdx > 0
          ? allText.slice(0, matchIdx).split(/\s+/).filter(Boolean).length
          : 0;
        const totalWords = allText.split(/\s+/).filter(Boolean).length;
        if (totalWords > 0) {
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

  // Check robots.txt
  const crawlerStatuses: CrawlerStatus[] = [];
  let robotsTxt = "";
  try {
    const robotsRes = await safeFetch(`${baseUrl}/robots.txt`, {
      headers,
      timeoutMs: 10000,
      maxBytes: 512 * 1024,
    });
    robotsTxt = await robotsRes.text();
  } catch {}

  const rules = parseRobotsTxt(robotsTxt);
  for (const crawler of AI_CRAWLERS) {
    const specificRule = rules.get(crawler.agent);
    const wildcardRule = rules.get("*");
    const blocked = specificRule !== undefined ? specificRule : (wildcardRule !== undefined ? wildcardRule : false);
    crawlerStatuses.push({
      name: crawler.name,
      allowed: !blocked,
      type: crawler.type,
    });
  }

  // Check llms.txt
  let hasLlmsTxt = false;
  try {
    const llmsRes = await safeFetch(`${baseUrl}/llms.txt`, {
      headers,
      timeoutMs: 8000,
      maxBytes: 256 * 1024,
    });
    hasLlmsTxt = llmsRes.ok;
  } catch {}

  // Calculate scores
  const avgCitabilityScore = citabilityBlocks.length > 0
    ? citabilityBlocks.reduce((sum, b) => sum + b.score, 0) / citabilityBlocks.length
    : 0;

  const allowedCrawlerRatio = crawlerStatuses.filter(c => c.allowed).length / crawlerStatuses.length;
  const presentSchemaCount = structuredDataTypes.filter(s => s.present).length;
  const schemaScore = Math.round((presentSchemaCount / structuredDataTypes.length) * 100);
  
  // Technical SEO score
  const technicalIssues: string[] = [];
  const quickWins: string[] = [];
  let technicalScore = 60;

  if (hasHttps) technicalScore += 10;
  else { technicalIssues.push("Site not using HTTPS"); quickWins.push("Migrate to HTTPS"); }

  if (hasCanonical) technicalScore += 10;
  else { technicalIssues.push("No canonical tag found"); quickWins.push("Add canonical tags to prevent duplicate content"); }

  if (requiresJavaScript) {
    technicalIssues.push(
      `Page requires JavaScript to render content (raw HTML: ${rawHtmlWordCount} words, rendered: ${renderedWordCount} words). Most AI crawlers (GPTBot, ClaudeBot, PerplexityBot) do not execute JavaScript and will see almost nothing.`
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

  if (!hasLlmsTxt) { quickWins.push("Create an llms.txt file to help AI crawlers understand your site"); }
  else technicalScore += 10;

  if (allowedCrawlerRatio < 0.5) {
    technicalIssues.push("More than half of AI crawlers are blocked by robots.txt");
    quickWins.push("Update robots.txt to allow key AI crawlers (GPTBot, ClaudeBot, PerplexityBot)");
  }

  if (schemaScore < 25) {
    quickWins.push("Add structured data (Organization, Article, FAQ schemas) to improve AI discoverability");
  }

  if (!description) { technicalIssues.push("Missing meta description"); quickWins.push("Add a compelling meta description (150-160 chars)"); }
  if (!title) { technicalIssues.push("Missing title tag"); quickWins.push("Add a descriptive title tag"); }

  if (avgCitabilityScore < 40) {
    quickWins.push("Restructure content into self-contained 134-167 word passages with clear answers");
  }

  technicalScore = Math.min(100, technicalScore);

  const citabilityScore = Math.min(100, Math.round(avgCitabilityScore * 1.2));
  const crawlerScore = Math.round(allowedCrawlerRatio * 100);
  const contentQualityScore = Math.min(100, Math.round(
    (wordCount > 1000 ? 40 : wordCount / 25) +
    (description ? 15 : 0) +
    (title ? 10 : 0) +
    (citabilityBlocks.filter(b => b.grade === "A" || b.grade === "B").length * 3)
  ));

  // Platform scores
  const platforms: PlatformScore[] = [
    {
      platform: "ChatGPT / OpenAI",
      score: Math.round((crawlerStatuses.find(c => c.name === "GPTBot")?.allowed ? 50 : 10) + citabilityScore * 0.3 + schemaScore * 0.2),
      status: crawlerStatuses.find(c => c.name === "GPTBot")?.allowed ? "Indexed" : "Blocked",
      recommendations: ["Ensure GPTBot is allowed in robots.txt", "Use FAQ schema for Q&A content", "Include citations and statistics"],
    },
    {
      platform: "Claude / Anthropic",
      score: Math.round((crawlerStatuses.find(c => c.name === "ClaudeBot")?.allowed ? 50 : 10) + citabilityScore * 0.3 + contentQualityScore * 0.2),
      status: crawlerStatuses.find(c => c.name === "ClaudeBot")?.allowed ? "Indexed" : "Blocked",
      recommendations: ["Allow ClaudeBot in robots.txt", "Focus on E-E-A-T signals", "Create comprehensive topic clusters"],
    },
    {
      platform: "Perplexity",
      score: Math.round((crawlerStatuses.find(c => c.name === "PerplexityBot")?.allowed ? 50 : 10) + citabilityScore * 0.35 + contentQualityScore * 0.15),
      status: crawlerStatuses.find(c => c.name === "PerplexityBot")?.allowed ? "Indexed" : "Blocked",
      recommendations: ["Allow PerplexityBot in robots.txt", "Provide factual, citation-ready content", "Link to authoritative sources"],
    },
    {
      platform: "Google AI Overviews",
      score: Math.round(technicalScore * 0.4 + citabilityScore * 0.3 + schemaScore * 0.3),
      status: hasHttps ? "Eligible" : "At Risk",
      recommendations: ["Implement Core Web Vitals optimizations", "Use HowTo and FAQ schemas", "Build topical authority with comprehensive coverage"],
    },
  ];

  // Real brand authority via Wikipedia, DuckDuckGo, GitHub
  const hasOrgSchema = structuredDataTypes.some(
    (s) => s.present && (s.type === "Organization" || s.type === "LocalBusiness")
  );
  const hasFaqSchema = structuredDataTypes.some((s) => s.present && s.type === "FAQPage");
  const hasArticleSchema = structuredDataTypes.some((s) => s.present && s.type === "Article");
  const hasHowToSchema = structuredDataTypes.some((s) => s.present && s.type === "HowTo");
  const brandAuthority = await analyzeBrandAuthority(url, title, hasOrgSchema, hasLlmsTxt, orgSchemaName, ogSiteName);

  // Generate prioritized GEO recommendations from extracted content signals.
  // Source attribution for each recommendation lives in the @workspace/recommendations
  // catalog and is composed in by composeRec() in geoRecommendations.ts.
  const blockedAiCrawlers = crawlerStatuses.filter((c) => !c.allowed).map((c) => c.name);
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
    contentQuality: contentQualityScore,
    technicalSeo: technicalScore,
    structuredData: schemaScore,
    platformOptimization: Math.round(platforms.reduce((sum, p) => sum + p.score, 0) / platforms.length),
  };

  // Weighted GEO score (matches the repo's methodology)
  const geoScore = Math.round(
    scores.citability * 0.25 +
    scores.brandAuthority * 0.20 +
    scores.contentQuality * 0.20 +
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
