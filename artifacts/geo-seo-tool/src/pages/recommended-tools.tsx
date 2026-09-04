import { BookOpen, ExternalLink, Library, SearchCheck, ShieldCheck } from "lucide-react";
import { AuthoritySignalsCard } from "@/components/authority-signals-card";
import { SEO } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const REFERENCE_RESOURCES = [
  {
    source: "Google Search Central",
    title: "AI features and your website",
    description: "Google's official guidance for making content eligible to appear in AI-powered search experiences.",
    href: "https://developers.google.com/search/docs/appearance/ai-features",
  },
  {
    source: "OpenAI",
    title: "OpenAI crawlers",
    description: "The official reference for OAI-SearchBot, GPTBot, and ChatGPT-User controls.",
    href: "https://platform.openai.com/docs/bots",
  },
  {
    source: "Schema.org",
    title: "Structured data vocabulary",
    description: "The source vocabulary for Organization, Product, Article, FAQ, and other structured data types.",
    href: "https://schema.org/docs/schemas.html",
  },
  {
    source: "LearningSEO.io",
    title: "SEO learning roadmap",
    description: "A practitioner-curated collection of SEO learning resources organized by topic and experience level.",
    href: "https://learningseo.io/",
  },
];

export default function RecommendedTools() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 md:px-8 md:py-14">
      <SEO
        title="Recommended SEO and GEO Tools | AEO Improvement"
        description="Independent tools, platforms, and official references that can help you implement your SEO and GEO action plan."
        path="/recommended-tools"
        index={false}
      />

      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
          <Library className="h-4 w-4" />
          Implementation library
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Recommended tools</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          Use this library when an audit recommendation requires a third-party platform, publisher,
          or technical reference. We explain where each resource fits, what it may help with, and
          where you should use judgment before investing time or money.
        </p>
      </header>

      <Card className="border-emerald-200 bg-emerald-50/60">
        <CardContent className="grid gap-4 py-5 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <SearchCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Curated for a task</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">Choose a resource because it supports a specific action, not because it is on a list.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-slate-900">No guaranteed outcomes</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">A listing, link, or tool cannot guarantee rankings, traffic, or an AI citation.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Independent guidance</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">These links are recommendations, not paid placements or affiliate partnerships.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3" aria-labelledby="official-references-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="official-references-heading" className="text-xl font-semibold text-slate-950">Official references</h2>
            <p className="mt-1 text-sm text-slate-600">Start here when implementing technical SEO, crawler, or structured-data recommendations.</p>
          </div>
          <Badge variant="outline" className="border-emerald-200 text-emerald-700">Primary sources first</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {REFERENCE_RESOURCES.map((resource) => (
            <a
              key={resource.href}
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border bg-white p-4 transition-all hover:border-emerald-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{resource.source}</p>
                  <h3 className="mt-1 text-sm font-semibold text-slate-950">{resource.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{resource.description}</p>
                </div>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-emerald-700" />
              </div>
            </a>
          ))}
        </div>
      </section>

      <section aria-labelledby="authority-tools-heading">
        <h2 id="authority-tools-heading" className="sr-only">Authority and distribution tools</h2>
        <AuthoritySignalsCard />
      </section>
    </div>
  );
}
