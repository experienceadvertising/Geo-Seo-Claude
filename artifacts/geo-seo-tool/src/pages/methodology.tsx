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
            Two methods showed measurable, repeatable lift across most prompt
            categories: adding{" "}
            <strong>quotations from authoritative sources</strong> (the paper labels
            this <em>Quotation Addition</em>) and adding{" "}
            <strong>statistics with sources</strong> (<em>Statistics Addition</em>).
            The paper reports group-level improvements on its <em>Position-Adjusted
            Word Count</em> (PAWC) and <em>Subjective Impression</em> (SI) metrics
            — these are aggregate effects on the corpus the paper studied, not
            guarantees for any specific page.
          </p>
          <p>
            Eight of the ten methods the paper tested showed{" "}
            <strong>weak, mixed, or negative</strong> results. We do not surface
            those as research-backed in our recommendations. When you see a "Research"
            badge in your audit, it points to one of the two consistently positive
            methods. When you see "Industry consensus," the underlying advice is
            sound practitioner technique that the paper either did not test or
            found inconclusive.
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
          <CardDescription>Why we don't currently personalize advice based on your search rank.</CardDescription>
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
            We do not yet personalize recommendations based on your current
            SERP position — our audits look at the page in isolation. Position-
            conditional advice is on our roadmap as a future feature: once we
            integrate live ranking data, we'll be able to suppress or rephrase
            recommendations that work against high-ranking pages. Until then,
            assume our recommendations are tuned for pages that are <em>not
            already</em> dominating their target queries.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Primary references</CardTitle></CardHeader>
        <CardContent className="text-sm leading-relaxed">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <a className="text-emerald-700 underline" href="https://signal.zyppy.com/p/seo-strategies-for-ai-search" target="_blank" rel="noreferrer">SEO Strategies for AI Search</a>
              {" "}by <strong>Cyrus Shepard</strong>, Zyppy Signal — cross-references 54 AI citation studies and ranks the top citation factors by score. Several of our highest-weighted recommendations, including snippet controls (Preview Controls, 9.2/10) and content placement (8.8/10), trace directly to this analysis.
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
            A recurring finding in practitioner research is that AI engines do not
            discover new brands — they select from brands they already recognize.
            Citation behavior is downstream of entity recognition: if the model's
            knowledge graph does not associate your brand with a specific problem
            space, additional content on your site produces little lift because
            the retrieval step never reaches you.
          </p>
          <p>
            The practical consequence is that off-site signals — mentions on
            Wikipedia, industry publications, Reddit, LinkedIn, and authoritative
            directories — often move the needle faster than on-page changes for
            brands with low existing AI visibility. Our audit surfaces your current
            brand authority footprint precisely because this is where the gap is
            most likely to be.
          </p>
          <p>
            A second finding worth understanding: cited sources are not stable.
            Industry analysis of major AI platforms shows that between 40% and 60%
            of cited sources rotate month-to-month. This is why a single audit
            taken as a permanent baseline is misleading. Our AEO score is designed
            to be tracked over time, not read once.
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
