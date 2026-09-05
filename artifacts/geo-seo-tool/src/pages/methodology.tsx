import React from "react";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, BarChart3, Users, BadgeCheck, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEO, breadcrumbJsonLd } from "@/components/seo";
import { AUTHOR_PERSON_LD, PRIMARY_AUTHOR, PUBLISHER_ORG } from "@/data/author";

const PAGE_TITLE = "Methodology — How the AEO Improvement audit score works";
const PAGE_DESC =
  "How AEO Improvement scores a URL: the six pillars, where each recommendation comes from (Princeton/IIT Delhi GEO research, internal benchmarks, practitioner consensus), and exactly which claims we will and won't make.";

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: PAGE_TITLE,
  description: PAGE_DESC,
  datePublished: "2026-05-05",
  dateModified: "2026-05-05",
  author: AUTHOR_PERSON_LD,
  publisher: PUBLISHER_ORG,
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://aeoimprovement.com/methodology" },
  citation: [
    {
      "@type": "ScholarlyArticle",
      name: "GEO: Generative Engine Optimization",
      author: "Aggarwal, Murahari et al.",
      publisher: "Princeton University / IIT Delhi (KDD 2024)",
    },
    {
      "@type": "Article",
      name: "SEO Strategies for AI Search",
      author: "Cyrus Shepard",
      publisher: "Zyppy Signal",
      url: "https://signal.zyppy.com/p/seo-strategies-for-ai-search",
    },
  ],
};

const methodologyBreadcrumb = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Methodology", path: "/methodology" },
]);

export default function Methodology() {
  return (
    <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SEO
        title={PAGE_TITLE}
        description={PAGE_DESC}
        path="/methodology"
        ogType="article"
        publishedTime="2026-05-05"
        modifiedTime="2026-07-22"
        authorName={PRIMARY_AUTHOR.name}
        jsonLd={[articleJsonLd, methodologyBreadcrumb]}
      />
      <div>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Methodology</h1>
          <Badge variant="outline" className="font-mono text-xs gap-1">
            <RefreshCw className="h-3 w-3" /> v2026.07
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          By <a href={PRIMARY_AUTHOR.url} rel="author" className="text-emerald-700 hover:underline font-medium">{PRIMARY_AUTHOR.name}</a>, {PRIMARY_AUTHOR.jobTitle} · Last reviewed July 22, 2026
        </p>
        <p className="mt-2 text-muted-foreground">
          How AEO Improvement turns a URL into a prioritized list of recommendations,
          and where each claim comes from.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>From a finding to an implemented improvement</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>Each audit finding now includes a practical implementation guide: who can help, steps to take, an example, checks after publishing, and signals to watch afterward. Weekly task emails use the same guidance. You remain in control of changes to your website.</p>
          <p>Our editorial guidance draws on Cyrus Shepard and Zyppy Signal's public work, including <a className="underline" href="https://signal.zyppy.com/p/content-effort">Content Effort (August 13, 2026)</a> and <a className="underline" href="https://signal.zyppy.com/p/seo-strategies-for-ai-search">SEO strategies for AI search (August 4, 2026)</a>. These are attributed expert guidance, not guaranteed outcomes or proof of Google's private ranking weights.</p>
          <p>We assess visible page signals. We cannot establish whether underlying testing really happened, whether every AI system sees a page, or whether a later ranking change was caused by your edit. Generated code and examples need review before use.</p>
          <p><strong>Is a 2024 source too old?</strong> Not automatically. The KDD 2024 GEO paper is foundational research in its own experimental setting. Its results do not establish expected gains on today's production models. Current platform documentation governs platform-specific advice; newer evidence can qualify or replace older recommendations.</p>
          <p>For Google AI Overviews and AI Mode, <a className="underline" href="https://developers.google.com/search/docs/appearance/ai-features">Google's guidance</a> emphasizes established SEO practices and states that no special AI markup is required. We do not treat an optional file or a schema type as a citation guarantee.</p>
          <p className="text-muted-foreground">Implementation guidance reviewed September 5, 2026. Scoring weights are unchanged by this documentation update.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">The six-dimension AEO score</CardTitle>
          <CardDescription>The UI, API, PDF report, and benchmark use this same weighted formula.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ["Citability", "25%", "Self-contained, answer-ready content blocks"],
              ["Brand Authority", "20%", "Confident external entity signals"],
              ["AI Crawler Access", "20%", "Search/live-fetch bots, indexability, snippet and raw HTML access"],
              ["Technical SEO", "15%", "HTTPS, canonical, sitemap, server visibility, metadata"],
              ["Schema Markup", "10%", "Weighted Organization, FAQ, Article, Product, HowTo and breadcrumb markup"],
              ["Platform Optimization", "10%", "Average readiness across ChatGPT, Claude, Perplexity and Google AI Overviews"],
            ].map(([name, weight, detail]) => <div key={name} className="border rounded-md p-3"><div className="flex justify-between font-semibold"><span>{name}</span><span>{weight}</span></div><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>)}
          </div>
          <p><strong>AI Crawler Access formula:</strong> 70% comes from citation-path bot access, 15% from the absence of <code>noindex</code>, 10% from snippet permission, and 5% from substantive raw HTML. Training-only bots such as GPTBot, ClaudeBot, and Google-Extended do not affect this score.</p>
          <p><strong>llms.txt:</strong> is reported as an optional content map but has no scoring effect. It is not presented as a citation gate or a default recommendation.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">July 2026 methodology change log</CardTitle></CardHeader>
        <CardContent className="text-sm leading-relaxed space-y-2">
          <p><strong>Freshness moved to the front:</strong> visible last-updated dates and genuinely refreshed evidence are prioritized before optional files.</p>
          <p><strong>Crawler roles were separated:</strong> search-index and live-fetch bots now determine citation access; training bots are reported as an IP choice.</p>
          <p><strong>llms.txt was downgraded:</strong> it remains available as an optional content map but no longer appears as a headline fix.</p>
          <p><strong>Entity confidence was tightened:</strong> ambiguous external profiles are omitted from generated <code>sameAs</code> markup unless the match passes a business-entity confidence check.</p>
        </CardContent>
      </Card>

      {/* ── Section 1: What the research actually says ─────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-emerald-600" /> What the research actually says
          </CardTitle>
          <CardDescription>The honest framing of the GEO paper our work draws on.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed space-y-3">
          <p>
            The starting point for our research-tagged recommendations is{" "}
            <a className="text-emerald-700 underline" href="https://dl.acm.org/doi/10.1145/3637528.3671900" target="_blank" rel="noreferrer"><em>GEO: Generative Engine Optimization</em></a> by Aggarwal, Murahari et al.
            (Princeton / IIT Delhi, KDD 2024). The paper introduces a benchmark of
            ten content-modification methods and reports their average effect on
            AI-engine citation behavior across a held-out prompt corpus.
          </p>
          <p>
            The paper evaluates content changes in a particular experimental
            setting. Its results are useful context for evidence-led content,
            but they do not establish what every current AI platform rewards
            or predict the outcome for an individual page.
          </p>
          <p>
            A "Research" badge links to the cited study. "Expert guidance"
            identifies attributed practitioner interpretation, including Zyppy
            Signal. Neither badge means a recommendation guarantees a ranking
            or citation improvement. Review the source and the finding together.
          </p>
          <p className="text-muted-foreground italic">
            We deliberately do not display the paper's percent-lift numbers next
            to individual recommendations. Those numbers are corpus-level averages
            with wide per-category ranges; reproducing them as a per-page promise
            would over-claim. Where the catalog needs to express a precise
            number, that number lives in a structured <code>expectedLift</code>{" "}
            field with its own citation.
          </p>
        </CardContent>
      </Card>

      {/* ── Section 2: SERP-position note (future feature) ─────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-sky-600" /> A note on SERP position
          </CardTitle>
          <CardDescription>Use observed performance to put page-level findings in context.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed space-y-3">
          <p>
            The GEO paper observed that the same content modification can
            produce <strong>opposite</strong> effects depending on a page's
            existing search-results rank. For example, adding cited sources
            helped pages currently ranking around position 5 substantially,
            while reducing visibility for pages already ranking at position 1.
            This is a real, important finding.
          </p>
          <p>
            Connected Search Console performance and tracked keyword snapshots
            provide context alongside page-level findings. Protect pages that
            already perform well: make a focused change, record it, and compare
            later observations. A ranking position does not prove that a particular
            edit will help, and traffic movement does not establish causation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">How we choose sources</CardTitle></CardHeader>
        <CardContent className="text-sm leading-relaxed">
          <p className="mb-3">No single publisher defines our advice. Official platform documentation explains eligibility and controls. Primary studies provide evidence within their tested settings. Practitioner sources, including Zyppy Signal, provide attributed interpretation. Your connected performance data helps put findings in context, but does not prove causation.</p>
          <p className="mb-3">We favor actionable guidance tied to an observed finding. We do not treat a preferred word count, an updated date, a byline, or special AI markup as a ranking guarantee. Implementation references are separate from the evidence label on the original finding.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><a className="underline" href="https://www.searchpilot.com/resources/case-studies/will-adding-faq-content-to-footer-copy-improve-organic-traffic">SearchPilot's category-page experiment</a> informs conditional buying-question examples. Its result is site-specific, not a promise for every FAQ.</li>
            <li><a className="underline" href="https://www.searchpilot.com/resources/case-studies/how-does-ai-content-impact-listing-pages">SearchPilot's listing-page experiment</a> supports testing useful content and checking rendering separately. The test changed both, so it cannot isolate either as the sole cause.</li>
            <li><a className="underline" href="https://ahrefs.com/blog/schema-ai-citations/">Ahrefs' schema study</a> did not find a clear citation uplift in its already-cited sample. We retain accurate markup guidance without promising citation gains.</li>
            <li><a className="underline" href="https://ahrefs.com/blog/do-ai-assistants-prefer-to-cite-fresh-content/">Ahrefs' freshness analysis</a> is observational. It does not show that changing dates improves visibility.</li>
            <li><a className="underline" href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content">Google's helpful-content guidance</a>: genuine experience, useful information, and transparent authorship.</li>
            <li><a className="underline" href="https://developers.google.com/search/docs/crawling-indexing/links-crawlable">Google's link guidance</a>: discoverable links and descriptive anchor text. Our implementation checklist includes checks users can carry out on the affected page, not a claim that we crawled their entire site.</li>
            <li>
              <a className="text-emerald-700 underline" href="https://signal.zyppy.com/p/seo-strategies-for-ai-search" target="_blank" rel="noreferrer">SEO Strategies for AI Search</a>
              {" "}by <strong>Cyrus Shepard</strong>, Zyppy Signal. Expert guidance on search eligibility, useful content, and brand clarity. This editorial framework is not a measurement of Google's ranking weights.
            </li>
            <li><a className="text-emerald-700 underline" href="https://dl.acm.org/doi/10.1145/3637528.3671900" target="_blank" rel="noreferrer">GEO: Generative Engine Optimization</a> — Aggarwal, Murahari et al. (Princeton / IIT Delhi, KDD 2024). The academic foundation for our research-tagged recommendations around quotation addition and statistics with sources.</li>
            <li><a className="text-emerald-700 underline" href="https://platform.openai.com/docs/bots" target="_blank" rel="noreferrer">OpenAI crawler documentation</a> for OAI-SearchBot, ChatGPT-User, and GPTBot roles.</li>
            <li><a className="text-emerald-700 underline" href="https://developers.google.com/search/docs/crawling-indexing/robots/intro" target="_blank" rel="noreferrer">Google robots.txt documentation</a> and <a className="text-emerald-700 underline" href="https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data" target="_blank" rel="noreferrer">structured data guidance</a>.</li>
            <li><a className="text-emerald-700 underline" href="https://schema.org/Organization" target="_blank" rel="noreferrer">Schema.org Organization</a> and <a className="text-emerald-700 underline" href="https://schema.org/FAQPage" target="_blank" rel="noreferrer">FAQPage</a> definitions.</li>
          </ul>
        </CardContent>
      </Card>

      {/* ── Section 3: Internal benchmark — passage word count ─────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BadgeCheck className="h-4 w-4 text-sky-600" /> Internal benchmark: passage length
          </CardTitle>
          <CardDescription>How we derive our 134–167 word answer-passage range.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed space-y-3">
          <p>
            Our citability scoring includes a target range of{" "}
            <strong>134 to 167 words per answer-style passage</strong>. This
            range is an internal benchmark, not a research-paper figure: we
            measured the median and interquartile word count of paragraphs
            that ChatGPT, Claude, Perplexity, and Google AI Overviews actually
            cite back, across a held-out corpus of audited pages.
          </p>
          <p>
            We treat this as a benchmark rather than a hard rule. Passages
            shorter than the range are usually too thin to anchor a citation;
            passages longer than the range tend to get partially excerpted or
            skipped. The range is reviewed as the corpus grows and as engine
            citation behavior shifts.
          </p>
          <p className="text-muted-foreground italic">
            Recommendations citing this benchmark show a "Benchmark" badge
            with our internal methodology page as the source link. The
            underlying corpus is updated quarterly.
          </p>
        </CardContent>
      </Card>

      {/* ── Section 4: Editorial note on practitioner_consensus ────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-slate-600" /> What "industry consensus" means
          </CardTitle>
          <CardDescription>The third source category, and why it isn't research.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed space-y-3">
          <p>
            About four-fifths of the recommendations in our catalog carry an
            "Industry consensus" badge. These are pieces of practice that are
            widely applied by AEO and SEO practitioners and that have a clear
            mechanistic rationale, but that have not (to our knowledge) been
            tested in a peer-reviewed study. Examples include adding FAQ
            schema, opening with a direct-answer paragraph, or ensuring
            canonical URLs.
          </p>
          <p>
            We label these honestly rather than dressing them up as research.
            Each one points to a public source — usually documentation from
            the engine vendor, a search-quality rater guidelines section, or a
            well-known practitioner write-up — but the citation is supporting
            context, not proof of effect. The visual weight of the badge is
            intentionally lighter than research and benchmark badges so it's
            obvious at a glance which claims rest on which kind of evidence.
          </p>
        </CardContent>
      </Card>

      {/* ── Section 5: Entity recognition and citation volatility ──────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-emerald-600" /> Why entity recognition comes before content
          </CardTitle>
          <CardDescription>The distinction between being discoverable and being citable.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed space-y-3">
          <p>
            Clear, consistent brand facts help people understand who you are,
            what you offer, and who you serve. Describe those facts accurately
            on your home, about, and product pages rather than expecting readers
            to piece them together from vague claims.
          </p>
          <p>
            Keep profiles you control consistent with your website. Seek genuine
            coverage and customer feedback where relevant, without manufacturing
            reviews or mentions. Off-site presence complements useful on-site
            information; it is not a substitute for it.
          </p>
          <p>
            Citation observations can vary across prompts, platforms, and time.
            Keep the test conditions visible when comparing results. An audit
            readiness score is not a measurement of actual citation share.
          </p>
        </CardContent>
      </Card>

      {/* ── Section 6: Source of truth pointer ─────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source of truth</CardTitle>
          <CardDescription>Where the recommendations and their citations actually live.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed space-y-3">
          <p>
            Every recommendation, citation, source URL, verification date, and
            editorial note in this product is read from a single
            version-controlled JSON file:
          </p>
          <pre className="rounded bg-muted p-3 text-xs overflow-x-auto">
{`lib/recommendations/data/recommendations.json`}
          </pre>
          <p>
            That file is the only place those facts exist. The server boots by
            validating it against a strict schema; if a recommendation marked
            "research" is missing a citation, or a verified recommendation is
            missing its verification date, the server refuses to start. There
            is no second copy in the codebase that could drift out of sync.
          </p>
          <p>
            When we add or revise a recommendation, the change is a single
            commit to that file with a human reviewer on it. The schema
            version (<code>v1</code>) is exposed on every audit response so
            we can evolve the contract without breaking historical audits.
          </p>
        </CardContent>
      </Card>

      <div className="pt-2">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to audits
          </Button>
        </Link>
      </div>
    </div>
  );
}
