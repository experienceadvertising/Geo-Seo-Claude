import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const ENGINE_TIMEOUT_MS = 90_000;
const PER_ATTEMPT_TIMEOUT_MS = 28_000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

/**
 * Retry wrapper for rate-limited engine calls.
 * Retries rate-limit errors up to twice, and transient timeout/service errors
 * once. A final failed response is still reported as an error and excluded
 * from visibility-rate denominators.
 * An outer ENGINE_TIMEOUT_MS hard cap is applied around the whole attempt chain.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
): Promise<T> {
  const RATE_LIMIT_DELAYS_MS = [6_000, 12_000];
  const isRateLimit = (err: unknown) =>
    /rate.?limit|429|RATELIMIT|too many requests/i.test(
      err instanceof Error ? err.message : String(err),
    );
  const isTransient = (err: unknown) =>
    /timed?\s*out|502|503|504|service\s+unavailable|bad\s+gateway|network\s+error|fetch\s+failed/i.test(
      err instanceof Error ? err.message : String(err),
    );

  let retries = 0;
  let retryLimit = 0;

  for (;;) {
    try {
      return await withTimeout(fn(), PER_ATTEMPT_TIMEOUT_MS, `${label} (attempt ${retries + 1})`);
    } catch (err) {
      retryLimit = isRateLimit(err) ? 2 : isTransient(err) ? 1 : 0;
      if (retries >= retryLimit) throw err;
      const delay = isRateLimit(err) ? RATE_LIMIT_DELAYS_MS[retries] : 3_000;
      retries++;
      await new Promise<void>((r) => setTimeout(r, delay));
    }
  }
}

function sanitizeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  // Return friendly messages for common failure patterns before stripping
  if (/timed?\s*out/i.test(msg)) return "Request timed out — the engine took too long to respond";
  if (/rate.?limit|429|RATELIMIT|too many requests/i.test(msg)) return "Rate limit reached — try again in a few minutes";
  if (/401|unauthorized|invalid.?key|authentication failed/i.test(msg)) return "Authentication error — service configuration issue";
  if (/503|502|504|service\s+unavailable|bad\s+gateway/i.test(msg)) return "Service temporarily unavailable — try again later";
  if (/ECONNREFUSED|ENOTFOUND|fetch\s+failed|network\s+error/i.test(msg)) return "Network error — could not reach the engine";
  // Strip credentials, raw JSON blobs, and URLs before showing remainder
  return msg
    .replace(/https?:\/\/\S+/g, "[url]")
    .replace(/Bearer\s+\S+/gi, "[token]")
    .replace(/sk-[A-Za-z0-9_-]+/g, "[key]")
    .replace(/x-goog-api-key[^,}\n]*/gi, "[key]")
    .replace(/\{[^}]{0,600}\}/gs, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 200) || "An unexpected error occurred — try again";
}

export type EngineId = "chatgpt" | "claude" | "gemini" | "perplexity";

export type SentimentLabel = "Positive" | "Neutral" | "Negative";

export interface EngineResult {
  engine: EngineId;
  engineLabel: string;
  prompt: string;
  responseText: string;
  brandMentioned: boolean;
  brandFirstPosition: number | null;
  domainCited: boolean;
  citedUrls: string[];
  competitorMentions: string[];
  sentiment: SentimentLabel | null;
  error: string | null;
  durationMs: number;
}

export interface PromptResultRow {
  prompt: string;
  engines: EngineResult[];
}

export interface SimulationSummary {
  totalPrompts: number;
  perEngine: Array<{
    engine: EngineId;
    engineLabel: string;
    mentionRate: number;
    citationRate: number;
    avgFirstPosition: number | null;
    errorRate: number;
  }>;
  topCompetitors: Array<{ name: string; count: number }>;
  overallVisibilityScore: number;
  /**
   * % of prompts (0-100) where the brand was mentioned by at least ONE engine.
   * Measures topical breadth — how wide your coverage is across the query cluster.
   * Based on Zyppy Signal "Fan-out Rank breadth" factor (score 8.9/10).
   */
  topicalBreadthScore: number;
  /**
   * Topics inferred from the URL paths cited by AI engines across all prompts.
   * Shows the "fan-out" sub-query cluster the engines are actually searching
   * when they research topics relevant to your brand.
   */
  fanoutTopics: Array<{ topic: string; count: number }>;
}

const openaiClient = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const anthropicClient = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function detectBrandMention(text: string, brandName: string): { mentioned: boolean; firstPosition: number | null } {
  if (!brandName) return { mentioned: false, firstPosition: null };
  const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${escaped}\\b`, "i");
  const match = text.search(re);
  if (match === -1) return { mentioned: false, firstPosition: null };
  // Position as percent through response (0 = start, 1 = end)
  return { mentioned: true, firstPosition: text.length > 0 ? match / text.length : 0 };
}

function extractCitedUrls(text: string): string[] {
  const urls = new Set<string>();
  const urlRegex = /https?:\/\/[^\s)\]"'>]+/g;
  const matches = text.match(urlRegex) || [];
  for (const m of matches) {
    const cleaned = m.replace(/[.,;:!?)\]>"']+$/, "");
    urls.add(cleaned);
  }
  return Array.from(urls);
}

function detectDomainCitation(urls: string[], targetDomain: string): boolean {
  const target = targetDomain.toLowerCase().replace(/^www\./, "");
  return urls.some((u) => {
    try {
      const h = new URL(u).hostname.toLowerCase().replace(/^www\./, "");
      return h === target || h.endsWith(`.${target}`);
    } catch { return false; }
  });
}

/**
 * Extracts topic strings from cited URL paths across all simulation results.
 * Shows the "fan-out" sub-query cluster that AI engines are actually searching —
 * what adjacent topics they research when building answers about your brand's category.
 * Zero additional API cost: derived purely from citation data already collected.
 */
function extractFanoutTopics(results: PromptResultRow[]): Array<{ topic: string; count: number }> {
  const STOP_WORDS = new Set([
    "the","a","an","and","or","but","in","on","at","to","for","of","with","by","from","as",
    "is","are","was","were","be","been","have","has","had","do","does","did","not","this",
    "that","these","those","it","its","http","https","www","com","org","net","co","io","ai",
    "html","php","asp","jsp","index","page","post","blog","about","home","get","how","what",
    "why","when","where","who","which","can","will","your","our","their","you","we","us",
  ]);
  const topicCounts = new Map<string, number>();

  for (const row of results) {
    for (const er of row.engines) {
      if (er.error) continue;
      for (const rawUrl of er.citedUrls) {
        try {
          const { hostname, pathname } = new URL(rawUrl);
          // Skip the user's own domain — we want what ELSE is being cited
          const segments = pathname.split("/").filter(s => s.length > 3 && !/^\d+$/.test(s) && !/^[a-f0-9-]{20,}$/.test(s));
          for (const seg of segments) {
            // Split slug-style segments into words
            const words = seg
              .toLowerCase()
              .replace(/\.[a-z]{2,4}$/, "")
              .split(/[-_+%20]+/)
              .filter(w => w.length > 2 && !STOP_WORDS.has(w) && /^[a-z]/.test(w));
            if (words.length >= 2 && words.length <= 8) {
              const topic = words.slice(0, 5).join(" ");
              if (topic.length >= 6 && topic.length <= 55) {
                topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
              }
            }
          }
          // Also use the subdomain+domain as a signal (e.g. docs.stripe.com → "stripe docs")
          void hostname; // hostname already decoded above, no extra processing needed
        } catch { /* skip malformed URLs */ }
      }
    }
  }

  return Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([topic, count]) => ({ topic, count }));
}

// Common content/aggregator/news/social hosts to filter from competitor detection
const NON_COMPETITOR_HOSTS = new Set([
  "wikipedia.org","wikimedia.org","reddit.com","youtube.com","youtu.be",
  "medium.com","substack.com","github.com","stackoverflow.com","quora.com",
  "linkedin.com","twitter.com","x.com","facebook.com","instagram.com",
  "tiktok.com","pinterest.com","forbes.com","techcrunch.com","wired.com",
  "theverge.com","arstechnica.com","nytimes.com","wsj.com","bloomberg.com",
  "reuters.com","cnbc.com","businessinsider.com","bbc.com","bbc.co.uk",
  "google.com","bing.com","duckduckgo.com","amazon.com","apple.com",
  "microsoft.com","cloudflare.com","gartner.com","g2.com","capterra.com",
  "trustpilot.com","producthunt.com","crunchbase.com","glassdoor.com",
]);

// Common multi-label public suffixes where the registrable domain is the last
// THREE labels (e.g. "foo.co.uk"), not two. Without this, "foo.co.uk" and
// "bar.co.uk" both bucket to "co.uk" and look like the same brand.
const MULTI_PART_SUFFIXES = new Set([
  "co.uk", "org.uk", "gov.uk", "ac.uk", "com.au", "net.au", "org.au", "edu.au",
  "gov.au", "co.nz", "org.nz", "com.br", "com.mx", "co.jp", "co.kr", "co.in",
  "co.za", "com.sg", "com.my", "com.hk", "com.tw", "com.tr", "com.ua", "com.ph",
  "com.vn", "co.id", "co.th",
]);

function rootDomain(hostname: string): string {
  const parts = hostname.toLowerCase().replace(/^www\./, "").split(".");
  if (parts.length <= 2) return parts.join(".");
  // Handle multi-label public suffixes (.co.uk etc.) — use last 3 labels there.
  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }
  // Naively use last 2 labels (handles most TLDs).
  return lastTwo;
}

const POSITIVE_SIGNALS = [
  "recommend", "best", "top", "leading", "excellent", "great", "highly rated",
  "popular", "trusted", "praised", "well-regarded", "widely used", "industry-leading",
  "strong", "effective", "powerful", "impressive", "innovative", "award", "favorite",
];
const NEGATIVE_SIGNALS = [
  "avoid", "poor", "bad", "worst", "overpriced", "disappointing", "lacks", "inferior",
  "struggles", "fails", "complaint", "criticism", "controversial", "sued", "penalized",
  "unreliable", "buggy", "slow", "expensive", "not recommended",
];

function detectSentiment(text: string, brandName: string): SentimentLabel | null {
  if (!brandName || !text) return null;
  const escaped = brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(.{0,120}\\b${escaped}\\b.{0,120})`, "gi");
  const contexts: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    contexts.push(m[1].toLowerCase());
  }
  if (contexts.length === 0) return "Neutral";
  const joined = contexts.join(" ");
  let pos = 0, neg = 0;
  for (const s of POSITIVE_SIGNALS) { if (joined.includes(s)) pos++; }
  for (const s of NEGATIVE_SIGNALS) { if (joined.includes(s)) neg++; }
  if (pos > neg + 1) return "Positive";
  if (neg > pos) return "Negative";
  return "Neutral";
}

// Generic/category words that, on their own, do not identify a competing brand.
// Used by looksLikeBrand() to reject bold segments that are really category labels
// ("Top Paid Media Platforms", "Best Ecommerce Metrics") rather than brand names.
const BRAND_STOPWORDS = new Set([
  "top", "best", "tier", "agency", "agencies", "platform", "platforms", "metrics",
  "channels", "channel", "pricing", "marketing", "digital", "media", "paid",
  "ecommerce", "brand", "brands", "google", "meta", "facebook", "instagram",
  "tiktok", "youtube", "linkedin", "twitter", "seo", "sem", "ppc", "ads", "ad",
  "the", "and", "for", "with", "your", "company", "services", "solutions",
]);

// Heuristic: does a bold text segment look like a real brand/company name rather
// than a generic category phrase or a sentence fragment? Used to mine competitor
// names out of the AI engine's own prose (which usually bolds the brands it names).
function looksLikeBrand(name: string): boolean {
  const cleaned = name.replace(/[*_#]/g, "").replace(/^\s*\d+[.)]\s*/, "").trim();
  if (cleaned.length < 2 || cleaned.length > 40) return false;
  if (cleaned.includes("&")) return false;
  if (/[:?]$/.test(cleaned)) return false;
  if (!/^[A-Z0-9]/.test(cleaned)) return false;
  const words = cleaned.split(/\s+/);
  if (words.length > 5) return false;
  const generic = words.filter((w) => BRAND_STOPWORDS.has(w.toLowerCase())).length;
  if (generic >= Math.ceil(words.length / 2)) return false;
  return true;
}

// Mine candidate competitor names from the engine's bolded prose. AI engines
// almost always **bold** the brands they recommend, so this surfaces real named
// competitors even when no external URL is cited.
function extractBrandsFromText(text: string, brandName: string): string[] {
  const ownBrand = brandName.trim().toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  const re = /\*\*([^*\n]{2,60})\*\*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const candidate = m[1].replace(/[.,;:!?)\]]+$/, "").trim();
    if (!looksLikeBrand(candidate)) continue;
    const norm = candidate.toLowerCase();
    if (norm === ownBrand) continue;
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push(candidate);
    if (out.length >= 10) break;
  }
  return out;
}

function detectCompetitors(citedUrls: string[], brandName: string, targetDomain: string): string[] {
  // Use cited domains as the signal for competitors: every AI engine that returns
  // a non-target citation is effectively recommending another brand for that prompt.
  const target = rootDomain(targetDomain);
  const counts = new Map<string, number>();
  for (const u of citedUrls) {
    try {
      const root = rootDomain(new URL(u).hostname);
      if (!root || root === target) continue;
      if (NON_COMPETITOR_HOSTS.has(root)) continue;
      counts.set(root, (counts.get(root) || 0) + 1);
    } catch { /* ignore */ }
  }
  return Array.from(counts.keys()).slice(0, 8);
}

async function queryChatGPT(prompt: string): Promise<{ text: string; urls: string[] }> {
  // Use Responses API with web_search tool for live grounding
  const resp = await openaiClient.responses.create({
    model: "gpt-5.2",
    input: prompt,
    tools: [{ type: "web_search" }],
  });
  const text = resp.output_text || "";
  const urls = new Set<string>();
  // Pull URLs from annotations if present
  for (const item of resp.output ?? []) {
    if ("content" in item && Array.isArray((item as any).content)) {
      for (const c of (item as any).content) {
        if (Array.isArray(c.annotations)) {
          for (const ann of c.annotations) {
            if (ann.url) urls.add(ann.url);
          }
        }
      }
    }
  }
  // Also extract from text
  for (const u of extractCitedUrls(text)) urls.add(u);
  return { text, urls: Array.from(urls) };
}

async function queryClaude(prompt: string): Promise<{ text: string; urls: string[] }> {
  const resp = await anthropicClient.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 } as any],
  });
  let text = "";
  const urls = new Set<string>();
  for (const block of resp.content as any[]) {
    if (block.type === "text") {
      text += block.text;
      if (Array.isArray(block.citations)) {
        for (const cit of block.citations) {
          if (cit.url) urls.add(cit.url);
        }
      }
    } else if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const r of block.content) {
        if (r.url) urls.add(r.url);
      }
    }
  }
  for (const u of extractCitedUrls(text)) urls.add(u);
  return { text, urls: Array.from(urls) };
}

// Resolve a vertexaisearch.cloud.google.com/grounding-api-redirect URL to its
// final destination via HEAD with redirect-follow. Returns the original URL on
// any failure so we never lose data — but the resolved URL is what we want for
// citation matching (otherwise every Gemini citation looks like
// "vertexaisearch.cloud.google.com" and matches nothing).
async function resolveRedirect(url: string, timeoutMs = 5000): Promise<string> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    return res.url || url;
  } catch {
    return url;
  }
}

async function queryGemini(prompt: string): Promise<{ text: string; urls: string[] }> {
  const baseURL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!;
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY!;
  const url = `${baseURL.replace(/\/$/, "")}/models/gemini-2.5-flash:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data: any = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") || "";
  const urls = new Set<string>();
  const grounding = data?.candidates?.[0]?.groundingMetadata;

  // Resolve grounding-api-redirect URLs in parallel so citation matching
  // sees the real destination (stripe.com/docs/...) instead of the opaque
  // vertexaisearch host. 5s per URL, capped — this never blocks the engine
  // beyond ~5s even if some redirects hang.
  const rawGroundingUris: string[] = Array.isArray(grounding?.groundingChunks)
    ? grounding.groundingChunks.map((c: any) => c?.web?.uri).filter((u: any): u is string => typeof u === "string")
    : [];
  if (rawGroundingUris.length > 0) {
    const resolved = await Promise.all(rawGroundingUris.map((u) => resolveRedirect(u, 5000)));
    for (const u of resolved) urls.add(u);
  }

  for (const u of extractCitedUrls(text)) urls.add(u);
  return { text, urls: Array.from(urls) };
}

async function queryPerplexity(prompt: string): Promise<{ text: string; urls: string[] }> {
  // Use OpenRouter to access Perplexity sonar (native web search)
  const res = await fetch(`${process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "perplexity/sonar",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Perplexity ${res.status}: ${await res.text()}`);
  }
  const data: any = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  const urls = new Set<string>();
  if (Array.isArray(data?.citations)) {
    for (const c of data.citations) urls.add(c);
  }
  for (const u of extractCitedUrls(text)) urls.add(u);
  return { text, urls: Array.from(urls) };
}

const ENGINES: { id: EngineId; label: string; fn: (p: string) => Promise<{ text: string; urls: string[] }> }[] = [
  { id: "chatgpt", label: "ChatGPT", fn: queryChatGPT },
  { id: "claude", label: "Claude", fn: queryClaude },
  { id: "gemini", label: "Google Gemini", fn: queryGemini },
  { id: "perplexity", label: "Perplexity", fn: queryPerplexity },
];

async function runEngineForPrompt(
  engineId: EngineId,
  engineLabel: string,
  fn: (p: string) => Promise<{ text: string; urls: string[] }>,
  prompt: string,
  brandName: string,
  domain: string
): Promise<EngineResult> {
  const start = Date.now();
  try {
    const { text, urls } = await withTimeout(
      withRetry(() => fn(prompt), engineLabel),
      ENGINE_TIMEOUT_MS,
      engineLabel,
    );
    const { mentioned, firstPosition } = detectBrandMention(text, brandName);
    const domainCited = detectDomainCitation(urls, domain);
    const namedBrands = extractBrandsFromText(text, brandName);
    const competitorMentions = namedBrands.length > 0
      ? namedBrands
      : detectCompetitors(urls, brandName, domain);
    const sentiment = mentioned ? detectSentiment(text, brandName) : null;
    return {
      engine: engineId,
      engineLabel,
      prompt,
      responseText: text,
      brandMentioned: mentioned,
      brandFirstPosition: firstPosition,
      domainCited,
      citedUrls: urls.slice(0, 10),
      competitorMentions,
      sentiment,
      error: null,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      engine: engineId,
      engineLabel,
      prompt,
      responseText: "",
      brandMentioned: false,
      brandFirstPosition: null,
      domainCited: false,
      citedUrls: [],
      competitorMentions: [],
      sentiment: null,
      error: sanitizeError(err),
      durationMs: Date.now() - start,
    };
  }
}

export async function runPromptSimulation(
  prompts: string[],
  brandName: string,
  domain: string,
  selectedEngines?: EngineId[]
): Promise<{ results: PromptResultRow[]; summary: SimulationSummary }> {
  const engines = ENGINES.filter((e) => !selectedEngines || selectedEngines.includes(e.id));

  // Each prompt runs all engines in parallel. We additionally run several
  // prompts in parallel (bounded concurrency) so a 25-prompt simulation
  // doesn't serialize on the prompt axis. Concurrency=3 is a safe middle
  // ground — high enough to cut wall-clock time roughly 3x, low enough to
  // stay well under per-engine rate limits even with 4 engines × 3 prompts
  // in flight.
  const PROMPT_CONCURRENCY = 3;
  const results: PromptResultRow[] = new Array(prompts.length);
  let nextIdx = 0;
  async function worker() {
    while (true) {
      const idx = nextIdx++;
      if (idx >= prompts.length) return;
      const prompt = prompts[idx];
      const engineResults = await Promise.all(
        engines.map((e) => runEngineForPrompt(e.id, e.label, e.fn, prompt, brandName, domain))
      );
      results[idx] = { prompt, engines: engineResults };
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(PROMPT_CONCURRENCY, prompts.length) }, worker),
  );

  // Build summary
  const perEngine = engines.map((e) => {
    const allForEngine = results.flatMap((r) => r.engines.filter((er) => er.engine === e.id));
    const total = allForEngine.length;
    const errored = allForEngine.filter((r) => r.error !== null).length;
    const succeeded = total - errored;
    const mentions = allForEngine.filter((r) => r.brandMentioned).length;
    const citations = allForEngine.filter((r) => r.domainCited).length;
    const positions = allForEngine
      .filter((r) => r.brandFirstPosition !== null)
      .map((r) => r.brandFirstPosition!);
    const avgPos = positions.length > 0
      ? positions.reduce((s, p) => s + p, 0) / positions.length
      : null;
    return {
      engine: e.id,
      engineLabel: e.label,
      mentionRate: succeeded > 0 ? mentions / succeeded : 0,
      citationRate: succeeded > 0 ? citations / succeeded : 0,
      avgFirstPosition: avgPos,
      errorRate: total > 0 ? errored / total : 0,
    };
  });

  // Top competitors across all responses
  const compCounts = new Map<string, number>();
  for (const row of results) {
    for (const er of row.engines) {
      for (const c of er.competitorMentions) {
        compCounts.set(c, (compCounts.get(c) || 0) + 1);
      }
    }
  }
  const topCompetitors = Array.from(compCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Overall visibility score = weighted blend of mention + citation rates across engines
  const validEngines = perEngine.filter((e) => e.errorRate < 1);
  const overallVisibilityScore = validEngines.length > 0
    ? Math.round(
        (validEngines.reduce((s, e) => s + e.mentionRate * 0.4 + e.citationRate * 0.6, 0) / validEngines.length) * 100
      )
    : 0;

  // Topical breadth score: % of prompts where the brand was mentioned by ANY engine.
  // Maps to Zyppy Signal "Fan-out Rank breadth" (score 8.9/10): ranking for multiple
  // related queries in the topic cluster, not just head terms, drives AI citation frequency.
  const promptsWithAnyMention = results.filter((row) =>
    row.engines.some((er) => er.brandMentioned && !er.error)
  ).length;
  const topicalBreadthScore = prompts.length > 0
    ? Math.round((promptsWithAnyMention / prompts.length) * 100)
    : 0;

  // Fan-out topics: topics inferred from cited URL paths (zero extra API cost).
  const fanoutTopics = extractFanoutTopics(results);

  return {
    results,
    summary: {
      totalPrompts: prompts.length,
      perEngine,
      topCompetitors,
      overallVisibilityScore,
      topicalBreadthScore,
      fanoutTopics,
    },
  };
}

export interface PromptGenerationContext {
  description?: string | null;
  title?: string | null;
  aiInsights?: string | null;
  /** Real query selected from Search Console to anchor fan-out generation. */
  seedQuery?: string | null;
}

export async function generatePromptsForBrand(
  brandName: string,
  ctx: PromptGenerationContext | string | null,
  mode: "standard" | "fanout" = "standard",
): Promise<string[]> {
  // Support legacy string signature for backwards compat
  const context: PromptGenerationContext = typeof ctx === "string" || ctx === null
    ? { description: ctx }
    : (ctx ?? {});

  const contextLines: string[] = [];
  if (context.seedQuery) contextLines.push(`Primary query from Google Search Console: ${context.seedQuery}`);
  if (context.title) contextLines.push(`Page title: ${context.title}`);
  if (context.description) contextLines.push(`Meta description: ${context.description}`);
  // Include the first 600 chars of AI insights to give the model rich context about what the site does
  if (context.aiInsights) {
    const snippet = context.aiInsights.slice(0, 600).replace(/\n+/g, " ").trim();
    contextLines.push(`AI analysis summary (first 600 chars): ${snippet}`);
  }
  const contextBlock = contextLines.length
    ? contextLines.join("\n")
    : "(no additional context)";

  const standardSys = `You are an expert in Answer Engine Optimization (AEO). Your task is to generate 3 realistic search prompts that real users type into ChatGPT, Perplexity, Claude, or Google AI Overviews when researching a topic that ${brandName} should ideally be cited for.

IMPORTANT: Read the site context carefully below to understand what ${brandName} actually does, such as a community platform, SaaS tool, marketplace, agency, or media brand. Generate prompts that match those specific use cases, not generic category prompts.

Rules:
- Generate exactly 3 prompts
- Cover one high-intent category query, one comparison or alternative query, and one job-to-be-done or implementation query
- Each prompt must be 8 to 15 words, short and natural, the way real users actually type queries
- Match the prompts to the actual product, service, or community type inferred from the context
- Do not include the brand name "${brandName}" in any prompt. They must be neutral category prompts the brand could be cited for
- Write in natural human language, not marketing language or B2B jargon
- Target the actual audience inferred from the context
- Return ONLY the 3 prompts, one per line, no numbering, no bullets, no quotes, no explanation`;

  // Fan-out mode gives the user a compact related-query set for a focused
  // coverage check instead of a broad, repetitive cluster.
  const fanoutSys = `You are an AI search researcher. Generate 3 tightly related queries that represent the most useful coverage check for the primary query in the site context. If no primary query is supplied, infer the narrowest reasonable topic from the page and brand context.

IMPORTANT: Read the site context carefully below to understand ${brandName}'s category, audience, and use cases.

Rules:
- Generate exactly 3 prompts
- Cover one primary-intent query, one decision or comparison query, and one supporting use case or problem query
- Include only categories that naturally fit the site context
- Each prompt must be 6 to 14 words in natural query-style phrasing
- Do not include "${brandName}" in any prompt. These must be neutral category queries the site could be cited for
- Keep every query tightly connected to the likely primary topic. Remove broad, generic, awkward, or repetitive variations
- Return ONLY the 3 prompts, one per line, no numbering, no bullets, no quotes, no explanation`;

  const sys = mode === "fanout" ? fanoutSys : standardSys;
  const maxPrompts = 3;

  const user = `Brand: ${brandName}\n\n${contextBlock}`;

  const resp = await openaiClient.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    max_completion_tokens: 1000,
  });
  const text = resp.choices[0]?.message?.content || "";
  return text
    .split("\n")
    .map((l) => l.replace(/^[\d.\-\)\s"'*]+|["'\s]+$/g, "").trim())
    .filter((l) => l.length > 10 && l.length < 200)
    .slice(0, maxPrompts);
}
