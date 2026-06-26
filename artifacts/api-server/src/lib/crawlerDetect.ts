// Known AI / LLM crawler + assistant user-agents. Each entry maps a friendly
// display name to a case-insensitive substring that appears in the bot's
// User-Agent. Order matters only for display grouping. Kept deliberately broad
// (training crawlers, live-retrieval fetchers, and on-demand assistant fetches)
// so the Crawler Activity view reflects the full AI surface, not just GPTBot.
const AI_CRAWLER_SIGNATURES: Array<{ name: string; ua: string }> = [
  { name: "GPTBot", ua: "gptbot" },
  { name: "OAI-SearchBot", ua: "oai-searchbot" },
  { name: "ChatGPT-User", ua: "chatgpt-user" },
  { name: "ClaudeBot", ua: "claudebot" },
  { name: "Claude-User", ua: "claude-user" },
  { name: "Claude-SearchBot", ua: "claude-searchbot" },
  { name: "Anthropic", ua: "anthropic-ai" },
  { name: "PerplexityBot", ua: "perplexitybot" },
  { name: "Perplexity-User", ua: "perplexity-user" },
  { name: "Google-Extended", ua: "google-extended" },
  { name: "Googlebot", ua: "googlebot" },
  { name: "Bingbot", ua: "bingbot" },
  { name: "Applebot", ua: "applebot" },
  { name: "Meta (AI)", ua: "meta-externalagent" },
  { name: "FacebookBot", ua: "facebookbot" },
  { name: "Amazonbot", ua: "amazonbot" },
  { name: "YouBot", ua: "youbot" },
  { name: "Bytespider", ua: "bytespider" },
  { name: "CCBot", ua: "ccbot" },
  { name: "cohere-ai", ua: "cohere-ai" },
  { name: "Diffbot", ua: "diffbot" },
  { name: "Timpibot", ua: "timpibot" },
];

/** Friendly names of every AI crawler we recognize (for empty-state UIs). */
export const KNOWN_AI_CRAWLERS = AI_CRAWLER_SIGNATURES.map((s) => s.name);

/**
 * Return the friendly crawler name if the User-Agent belongs to a known AI bot,
 * otherwise null. Matching is longest-signature-first so "google-extended" is
 * preferred over "googlebot" when both could match.
 */
export function detectAiCrawler(userAgent: string | undefined | null): string | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  let best: { name: string; len: number } | null = null;
  for (const sig of AI_CRAWLER_SIGNATURES) {
    if (ua.includes(sig.ua) && (!best || sig.ua.length > best.len)) {
      best = { name: sig.name, len: sig.ua.length };
    }
  }
  return best?.name ?? null;
}
