import { BookOpen, ExternalLink, Library, SearchCheck, ShieldCheck } from "lucide-react";
import { AuthoritySignalsCard } from "@/components/authority-signals-card";
import { SEO } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
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
];

const TOOL_GROUPS = [
  { id: "measure", title: "Measure performance", tools: [
    { name: "Google Search Console", cost: "Free Google tool", href: "https://search.google.com/search-console", when: "Check whether Google has indexed your page or investigate changes in search traffic.", first: "Verify your property, then inspect the exact page URL. The direct Google tool is free; connected analysis in AEO Improvement requires a paid plan." },
    { name: "Bing Webmaster Tools", cost: "Free", href: "https://www.bing.com/webmasters/", when: "Review Bing indexing and citation activity in supported Microsoft AI experiences.", first: "Verify your site, review indexing, and open AI Performance when available. This does not measure every AI platform." },
  ] },
  { id: "validate", title: "Fix and validate", tools: [
    { name: "PageSpeed Insights", cost: "Free", href: "https://pagespeed.web.dev/", when: "Your audit identifies performance problems or your page feels slow on mobile.", first: "Test the affected URL on mobile. Fix one diagnostic, then test again. Real-user data may be unavailable for low-traffic pages." },
    { name: "Google Rich Results Test", cost: "Free", href: "https://search.google.com/test/rich-results", when: "You have added structured data for a Google-supported rich result.", first: "Test your published URL and resolve relevant errors. Passing does not guarantee a rich result or an AI citation." },
    { name: "Schema Markup Validator", cost: "Free", href: "https://validator.schema.org/", when: "You need to validate Schema.org markup beyond Google's supported rich-result types.", first: "Paste your URL or markup. Check that the types and properties describe visible, accurate page content." },
    { name: "Screaming Frog SEO Spider", cost: "Free up to 500 URLs; paid options", href: "https://www.screamingfrog.co.uk/seo-spider/", when: "You or your agency need to check broken links, redirects, and metadata across a whole site.", first: "Start with a small crawl and review internal errors. JavaScript rendering and other advanced features require a paid licence." },
  ] },
  { id: "learn", title: "Expert learning resources", tools: [
    { name: "LearningSEO.io", cost: "Free resource", href: "https://learningseo.io/", when: "You want background on an unfamiliar SEO task before making changes.", first: "Choose the topic matching your action plan. This is practitioner-curated guidance, not official search-engine documentation." },
    { name: "Zyppy Signal: Content Effort", cost: "Public article; paid content may vary", href: "https://signal.zyppy.com/p/content-effort", when: "Your page needs more useful first-party information, evidence, or original analysis.", first: "Read Cyrus Shepard's guidance, then add one substantiated example or documented method. Expert guidance is not a promise of ranking gains." },
  ] },
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

      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5" aria-labelledby="start-here-heading">
        <h2 id="start-here-heading" className="text-xl font-semibold">Start with your AEO Improvement workspace</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">You do not need another subscription to start improving. Open your latest audit, choose one action, then use a resource below only if it helps you complete that task. Paid plans include controlled keyword tracking and connected Search Console analysis, subject to plan limits.</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-emerald-800">
          <Link href="/" className="underline">Open my dashboard</Link>
          <Link href="/projects" className="underline">Manage sites and connections</Link>
          <Link href="/upgrade" className="underline">Compare plan access</Link>
        </div>
      </section>
      <nav aria-label="Resource categories" className="flex flex-wrap gap-3 text-sm">
        {TOOL_GROUPS.map((group) => <a key={group.id} href={`#${group.id}`} className="rounded-lg border px-3 py-2 hover:bg-slate-50">{group.title}</a>)}
        <a href="#official-references-heading" className="rounded-lg border px-3 py-2 hover:bg-slate-50">Official references</a>
        <a href="#authority-tools-heading" className="rounded-lg border px-3 py-2 hover:bg-slate-50">Build awareness</a>
      </nav>
      {TOOL_GROUPS.map((group) => (
        <section key={group.id} id={group.id} aria-labelledby={`${group.id}-heading`} className="scroll-mt-6 space-y-3">
          <h2 id={`${group.id}-heading`} className="text-xl font-semibold text-slate-950">{group.title}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {group.tools.map((tool) => (
              <Card key={tool.name}>
                <CardHeader className="pb-3"><CardTitle className="text-base">{tool.name}</CardTitle><CardDescription>{tool.cost}</CardDescription></CardHeader>
                <CardContent className="space-y-3 text-sm leading-6">
                  <p><strong>Use it when:</strong> {tool.when}</p>
                  <p><strong>First step:</strong> {tool.first}</p>
                  <a href={tool.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-emerald-700 underline">Open {tool.name}<ExternalLink aria-hidden="true" className="h-4 w-4" /><span className="sr-only"> (opens in a new tab)</span></a>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}

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
      <p className="text-xs text-slate-500">Library reviewed September 5, 2026. Check provider pricing and eligibility before signing up. Free tools still require time and judgment to use well.</p>

      <section aria-labelledby="authority-tools-heading">
        <h2 id="authority-tools-heading" className="sr-only">Authority and distribution tools</h2>
        <AuthoritySignalsCard />
      </section>
    </div>
  );
}
