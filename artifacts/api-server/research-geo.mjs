import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

const client = new Anthropic({
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
});

const prompt = `I'm building a Generative Engine Optimization (GEO) audit tool. My current recommendation engine is based on the Princeton/IIT Delhi GEO paper (KDD 2024), which found these content signals impact AI citation likelihood:
- Adding statistics: +33.9% citation rate
- Expert quotations: +32% citation rate
- Fluent writing: +30% citation rate
- Adding citations to authoritative sources: +30.3% citation rate
- FAQ sections, freshness, byline, structured headings, etc.

This research is now ~2 years old. Research what has CHANGED or been ADDED to GEO best practices in 2025-2026. Search the web for the latest:

1. New research/studies on what AI engines (ChatGPT/SearchGPT, Perplexity, Claude, Gemini, Google AI Overviews/AI Mode) actually cite in 2026
2. Engine-specific weights — what does each engine prioritize differently?
3. New content patterns (llms.txt, AI-optimized markdown, conversational tone, "answer engine optimization")
4. What's been debunked or downgraded since the KDD 2024 study
5. Schema/structured data changes — has Article, FAQPage, HowTo schema impact changed? New schema types AI engines now favor?
6. E-E-A-T signals — author credentials, brand mentions, Reddit/forum presence in 2026
7. Specific tactical recommendations real GEO consultants are using in 2026

Be specific. For each new strategy, cite the source. Estimate impact percentages where possible. Focus on actionable, measurable tactics that an audit tool can detect from a webpage's HTML/content/headers.

Return your findings as a structured report I can use to update my recommendation engine.`;

const resp = await client.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 6000,
  messages: [{ role: "user", content: prompt }],
  tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
});

let text = "";
const sources = new Map();
for (const block of resp.content) {
  if (block.type === "text") {
    text += block.text;
    if (Array.isArray(block.citations)) {
      for (const c of block.citations) if (c.url) sources.set(c.url, c.title || "");
    }
  } else if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
    for (const r of block.content) if (r.url) sources.set(r.url, r.title || "");
  }
}

console.log("=== RESEARCH REPORT ===\n");
console.log(text);
console.log("\n=== SOURCES (" + sources.size + ") ===");
for (const [u, t] of sources) console.log(`- ${t} ${u}`);

fs.writeFileSync(".local/geo-research-2026.md",
  text + "\n\n## Sources\n" + Array.from(sources).map(([u, t]) => `- [${t}](${u})`).join("\n")
);
