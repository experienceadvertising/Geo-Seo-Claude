import React from "react";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, BarChart3, Users, BadgeCheck, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Methodology() {
  return (
    <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Methodology</h1>
          <Badge variant="outline" className="font-mono text-xs gap-1">
            <RefreshCw className="h-3 w-3" /> v2026.05
          </Badge>
        </div>
        <p className="mt-2 text-muted-foreground">
          How AEO Improvement turns a URL into a prioritized list of recommendations,
          and where each claim comes from. Last reviewed May 2026.
        </p>
      </div>

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
            <em>GEO: Generative Engine Optimization</em> by Aggarwal, Murahari et al.
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

      {/* ── Section 5: Source of truth pointer ─────────────────────────────── */}
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
