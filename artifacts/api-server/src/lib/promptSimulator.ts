import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const ENGINE_TIMEOUT_MS = 90_000;

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

function sanitizeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  // Strip URLs, API keys, and limit length
  return msg
    .replace(/https?:\/\/\S+/g, "[url]")
    .replace(/Bearer\s+\S+/gi, "[token]")
    .replace(/sk-[A-Za-z0-9_-]+/g, "[key]")
    .replace(/x-goog-api-key[^,}\n]*/gi, "[key]")
    .slice(0, 240);
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

function rootDomain(hostname: string): string {
  const parts = hostname.toLowerCase().replace(/^www\./, "").split(".");
  if (parts.length <= 2) return parts.join(".");
  // Naively use last 2 labels (handles most TLDs; .co.uk style edge cases over-bucket but acceptable)
  return parts.slice(-2).join(".");
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
  if (Array.isArray(grounding?.groundingChunks)) {
    for (const chunk of grounding.groundingChunks) {
      if (chunk?.web?.uri) urls.add(chunk.web.uri);
    }
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
    const { text, urls } = await withTimeout(fn(prompt), ENGINE_TIMEOUT_MS, engineLabel);
    const { mentioned, firstPosition } = detectBrandMention(text, brandName);
    const domainCited = detectDomainCitation(urls, domain);
    const competitorMentions = detectCompetitors(urls, brandName, domain);
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

  const results: PromptResultRow[] = [];
  for (const prompt of prompts) {
    // Run all engines for this prompt in parallel
    const engineResults = await Promise.all(
      engines.map((e) => runEngineForPrompt(e.id, e.label, e.fn, prompt, brandName, domain))
    );
    results.push({ prompt, engines: engineResults });
  }

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

  return {
    results,
    summary: {
      totalPrompts: prompts.length,
      perEngine,
      topCompetitors,
      overallVisibilityScore,
    },
  };
}

export interface PromptGenerationContext {
  description?: string | null;
  title?: string | null;
  aiInsights?: string | null;
}

export async function generatePromptsForBrand(
  brandName: string,
  ctx: PromptGenerationContext | string | null,
): Promise<string[]> {
  // Support legacy string signature for backwards compat
  const context: PromptGenerationContext = typeof ctx === "string" || ctx === null
    ? { description: ctx }
    : (ctx ?? {});

  const contextLines: string[] = [];
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

  const sys = `You are an expert in Answer Engine Optimization (AEO). Your task is to generate 8 realistic search prompts that real users type into ChatGPT, Perplexity, Claude, or Google AI Overviews when researching a topic that ${brandName} should ideally be cited for.

IMPORTANT: Read the site context carefully below to understand what ${brandName} actually does — community platform, SaaS tool, marketplace, agency, media brand, etc. — and generate prompts that match those specific use cases, not generic category prompts.

Rules:
- Generate exactly 8 prompts
- Mix intent types: 2 informational, 2 comparative, 2 how-to, 2 recommendation
- Match the prompts to the ACTUAL product/service/community type inferred from the context
- Do NOT include the brand name "${brandName}" in any prompt — they must be neutral category prompts the brand could be cited for
- Write in natural human language (not marketing language)
- Target the actual audience inferred from the context (B2B vs B2C, skill level, industry, etc.)
- Return ONLY the 8 prompts, one per line, no numbering, no bullets, no quotes, no explanation`;

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
    .slice(0, 8);
}
