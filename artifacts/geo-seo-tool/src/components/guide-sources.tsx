import { ExternalLink } from "lucide-react";

export function GuideSources() {
  const sources = [
    ["Cyrus Shepard, Zyppy Signal — SEO Strategies for AI Search", "https://signal.zyppy.com/p/seo-strategies-for-ai-search"],
    ["Cyrus Shepard, Zyppy Signal — Google AI expert survey", "https://signal.zyppy.com/p/google-ai-ranking-factors"],
    ["OpenAI crawler roles", "https://platform.openai.com/docs/bots"],
    ["Google AI features and search eligibility", "https://developers.google.com/search/docs/appearance/ai-features"],
    ["Google-Extended crawler control", "https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers"],
    ["Anthropic crawler roles", "https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler"],
    ["Google structured data guidance", "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data"],
    ["GEO research paper (KDD 2024)", "https://dl.acm.org/doi/10.1145/3637528.3671900"],
    ["AEO Improvement citation-readiness benchmark", "/ai-citation-readiness-benchmark"],
  ];
  return (
    <section className="space-y-3 border-t border-slate-200 pt-6">
      <h2 className="text-lg font-bold text-slate-900">Sources and data</h2>
      <ul className="grid sm:grid-cols-2 gap-2 text-sm">
        {sources.map(([label, href]) => <li key={href}><a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="inline-flex items-center gap-1 text-emerald-700 hover:underline">{label}{href.startsWith("http") && <ExternalLink className="h-3 w-3" />}</a></li>)}
      </ul>
      <p className="text-xs text-slate-500">Research and provider sources reviewed September 19, 2026. Expert survey responses are opinions, not confirmed ranking factors. Product claims are separated from research findings; aggregate benchmark data never exposes audited domains.</p>
    </section>
  );
}
