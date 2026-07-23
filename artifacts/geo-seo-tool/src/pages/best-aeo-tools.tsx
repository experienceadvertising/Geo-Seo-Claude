import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  ExternalLink,
  Crown,
  TrendingUp,
  Wallet,
  Building2,
  Zap,
  Users,
  Search,
  Trophy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO, breadcrumbJsonLd } from "@/components/seo";
import { COMPETITORS, OUR_FACTS } from "@/data/competitors";
import { AUTHOR_PERSON_LD, PRIMARY_AUTHOR, PUBLISHER_ORG } from "@/data/author";
import { GuideSources } from "@/components/guide-sources";

/**
 * "Best AEO tools 2026" buyer's guide.
 *
 * SEO targets:
 * - "best AEO tool" / "best answer engine optimization tool"
 * - "best AI search visibility tool"
 * - "AEO software comparison"
 *
 * Format is a ranked listicle (Google loves these for "best of" queries),
 * but we lead with category-based recommendations so the reader can self-
 * select instead of just trusting our ordering. We name ourselves #1
 * because we genuinely believe we're the best fit for self-serve marketers
 * — but we recommend specific competitors where they're the better fit
 * (e.g. Brandlight for enterprise narrative shaping). This is much more
 * trustworthy framing than a pure self-promotional listicle.
 *
 * Twin sister page: /best-geo-optimization-tools renders the same content
 * with GEO-targeted keywords. Both link to /vs/<slug> for deep dives.
 */

export interface BestAeoToolsPageProps {
  // Allow re-use for the GEO twin page with different keywords/copy
  variant?: "aeo" | "geo";
}

export default function BestAeoToolsPage({ variant = "aeo" }: BestAeoToolsPageProps) {
  const [, setLocation] = useLocation();
  const isGeo = variant === "geo";

  const acronym = isGeo ? "GEO" : "AEO";
  const fullName = isGeo ? "Generative Engine Optimization" : "Answer Engine Optimization";
  const path = isGeo ? "/best-geo-optimization-tools" : "/best-aeo-tools";

  const title = isGeo
    ? "Best GEO (Generative Engine Optimization) Tools in 2026: Honest Buyer's Guide"
    : "Best AEO (Answer Engine Optimization) Tools in 2026: Honest Buyer's Guide";
  const description = isGeo
    ? "Compare the best Generative Engine Optimization tools of 2026. Pricing, features, AI engines covered, and which GEO platform fits self-serve marketers, agencies, and enterprise teams."
    : "Compare the best Answer Engine Optimization tools of 2026. Pricing, features, AI engines covered, and which AEO platform fits self-serve marketers, agencies, and enterprise teams.";

  // ItemList schema — Google can render this as a ranked carousel for
  // "best of" queries. Position is per Schema.org spec (1-indexed).
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    name: title,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "AEO Improvement",
        url: "https://aeoimprovement.com/",
      },
      ...COMPETITORS.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.name,
        url: `https://aeoimprovement.com/vs/${c.slug}`,
      })),
    ],
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: "2026-05-03",
    dateModified: "2026-05-05",
    author: AUTHOR_PERSON_LD,
    publisher: PUBLISHER_ORG,
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://aeoimprovement.com${path}` },
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Comparisons", path: "/best-aeo-tools" },
    { name: isGeo ? "Best GEO tools" : "Best AEO tools", path },
  ]);

  const categoryPicks: { icon: React.ReactNode; title: string; bestFor: string; pick: string; pickHref: string; reasoning: string }[] = [
    {
      icon: <Wallet className="h-5 w-5 text-emerald-600" />,
      title: "Best for self-serve marketers and SMBs",
      bestFor: "Solo marketers, in-house SEO leads, indie founders",
      pick: "AEO Improvement",
      pickHref: `/upgrade?source=best-${acronym.toLowerCase()}-tools`,
      reasoning: `${OUR_FACTS.freeTier}, ${OUR_FACTS.proPrice} for Pro. Self-serve sign-up, no demos, automated JSON-LD and crawler-policy fixes.`,
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
      title: "Best for broad engine coverage",
      bestFor: "Brands monitoring across Copilot, Grok, and the long tail",
      pick: "AthenaHQ",
      pickHref: "/vs/athenahq",
      reasoning: "Advertises 7 monitored engines (the most we've found in this category). Self-serve plan starts at $95/mo.",
    },
    {
      icon: <Building2 className="h-5 w-5 text-emerald-600" />,
      title: "Best for enterprise attribution",
      bestFor: "Mid-market and enterprise teams plugging AI search into existing analytics",
      pick: "Profound",
      pickHref: "/vs/profound",
      reasoning: "Strong on attribution and zero-click impact analysis. Enterprise sales cycle — pricing on request.",
    },
    {
      icon: <Crown className="h-5 w-5 text-emerald-600" />,
      title: "Best for enterprise brand & narrative shaping",
      bestFor: "Global brands worried about AI bias and reputation",
      pick: "Brandlight",
      pickHref: "/vs/brandlight",
      reasoning: "Bias Score and Source Impact Score, paired with strategic advisory. Enterprise pricing only.",
    },
    {
      icon: <Search className="h-5 w-5 text-emerald-600" />,
      title: "Best for sentiment-first monitoring",
      bestFor: "Brand teams whose top question is 'how does AI describe us?'",
      pick: "Otterly.AI",
      pickHref: "/vs/otterly",
      reasoning: "Mention rate and sentiment analysis as the headline features. Pricing requires a trial or conversation.",
    },
  ];

  return (
    <>
      <SEO
        title={title}
        description={description}
        path={path}
        ogType="article"
        publishedTime="2026-05-03"
        modifiedTime="2026-07-22"
        authorName={PRIMARY_AUTHOR.name}
        jsonLd={[itemListJsonLd, articleJsonLd, breadcrumb]}
      />
      <div className="min-h-[calc(100vh-4rem)] py-10 px-4 bg-gradient-to-b from-slate-50/60 to-white">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero */}
          <header className="space-y-4 text-center">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5" /> 2026 Buyer's Guide · Updated May 2026
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight max-w-3xl mx-auto">
              The best {acronym} ({fullName}) tools in 2026
            </h1>
            <p className="text-sm text-slate-500">
              By <a href={PRIMARY_AUTHOR.url} rel="author" className="text-emerald-700 hover:underline font-medium">{PRIMARY_AUTHOR.name}</a>, {PRIMARY_AUTHOR.jobTitle} · Updated July 22, 2026
            </p>
            <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              An honest, category-by-category guide. We make {acronym} software ourselves —
              we'll be transparent about that — but we'll also recommend competitors when
              they're the better fit for your situation.
            </p>
          </header>

          {/* Variant-specific framing — gives this page substantially unique
              content vs its twin, so Google indexes both rather than picking
              one and folding the other. */}
          {isGeo ? (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Where the term GEO comes from</h2>
              <p className="text-slate-700 leading-relaxed">
                "Generative Engine Optimization" was introduced as a research term by Aggarwal,
                Murahari et al. in their 2024 KDD paper of the same name (Princeton / IIT Delhi).
                The paper benchmarks ten content-modification methods against generative AI
                retrievers and reports their effect on a metric called Position-Adjusted Word
                Count (PAWC) — essentially, how much weighted real-estate your source receives
                inside the AI's generated answer. Two methods produced repeatable lift across
                the corpus: <em>Quotation Addition</em> (citing authoritative third-party
                sources inline) and <em>Statistics Addition</em> (numeric facts with attribution).
                Eight of ten methods produced weak, mixed, or negative results — including
                "keyword stuffing" and "fluency optimization."
              </p>
              <p className="text-slate-700 leading-relaxed">
                If you're shopping for a GEO tool, the question to ask vendors is whether their
                recommendations map to what the academic literature has actually validated, or
                whether they extrapolate beyond it. Most marketing copy in this category implies
                a tighter cause-and-effect than the research supports. The honest framing is:
                two specific content techniques have measurable lift, and a long list of
                technical fundamentals (crawler access, structured data, server-side rendering,
                entity recognition) are necessary preconditions but don't have clean per-tactic
                effect sizes. Tools that label every recommendation with a confidence level —
                "research-backed," "industry consensus," "internal benchmark" — are easier to
                trust than tools that claim X% lift across the board.
              </p>
              <p className="text-slate-700 leading-relaxed">
                In practice, "GEO" and "AEO" describe the same work. The vocabulary varies by
                community (academic and AI-research circles tend to say GEO; in-house SEO teams
                and agencies tend to say AEO), but the implementation tasks are identical. We
                evaluate the same five vendors on both pages of this guide because the
                buyer-decision criteria don't change with the acronym.
              </p>
            </section>
          ) : (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">What AEO actually looks like in practice</h2>
              <p className="text-slate-700 leading-relaxed">
                On a typical week, a marketing team running AEO is doing a few specific things:
                checking their robots.txt allows OAI-SearchBot, ClaudeBot, PerplexityBot, and
                Google-Extended; running prompt simulations against ChatGPT, Claude, Gemini,
                and Perplexity to track which competitors get cited for the queries their
                buyers are asking; updating FAQ schema and answer-capsule paragraphs on their
                top five pages so AI engines have a clean direct-answer to lift; and watching
                a small dashboard for week-over-week mention rate. The work is unglamorous and
                repeatable — closer to ad-account hygiene than content marketing.
              </p>
              <p className="text-slate-700 leading-relaxed">
                A good AEO tool is judged on whether it reduces that weekly cycle from "two
                people for half a day" to "one person for an hour." That's why we weight the
                Fix Generator and prompt simulation flows so heavily in this guide — they're
                the parts of the loop that consume the most time when you're running AEO without
                tooling. A pure visibility-monitoring dashboard tells you the score is going
                down; it doesn't help you make the score go up. Look for tools that ship
                production-ready output (JSON-LD blocks and citation-bot robots.txt snippets)
                rather than just charts and exports.
              </p>
              <p className="text-slate-700 leading-relaxed">
                The other practitioner reality worth naming: AEO citation visibility is volatile.
                Cited sources can rotate from one run to the next across major engines. A single
                audit is a snapshot, not a baseline. Whichever tool you pick,
                run a recurring monthly check rather than a one-time setup pass. Even the best
                technical fixes degrade as crawlers, training cutoffs, and retrieval indexes
                change underneath you.
              </p>
            </section>
          )}

          {/* TL;DR */}
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="pt-6 pb-6 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Short answer
              </div>
              <p className="text-slate-800 leading-relaxed">
                {isGeo ? (
                  <>
                    <strong>If you came here from the GEO research paper:</strong> AEO Improvement
                    explicitly tags recommendations as "research-backed," "industry consensus," or
                    "internal benchmark" so you can audit which claims actually trace back to the
                    Aggarwal et al. KDD 2024 corpus.{" "}
                    <strong>For enterprise narrative-shaping:</strong> Brandlight has the strongest
                    bias-and-source-impact analysis in the category.{" "}
                    <strong>For attribution into existing analytics stacks:</strong> Profound.
                  </>
                ) : (
                  <>
                    <strong>For most marketers and agencies:</strong> AEO Improvement — self-serve,
                    free to start, automated Fix Generator drafts JSON-LD and crawler fixes,
                    transparent pricing at {OUR_FACTS.proPrice}.{" "}
                    <strong>For enterprises with a sales-cycle budget:</strong> Profound or
                    Brandlight, depending on whether you optimize for attribution or narrative
                    shaping.{" "}
                    <strong>For maximum engine coverage:</strong> AthenaHQ.
                  </>
                )}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0"
                  onClick={() => setLocation(`/upgrade?source=best-${acronym.toLowerCase()}-tools`)}
                >
                  Try AEO Improvement free <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* What to look for */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">What to look for in any {acronym} tool</h2>
            <p className="text-slate-600 leading-relaxed">
              {acronym === "AEO" ? "Answer" : "Generative"} Engine Optimization is a young
              category. Vendors describe themselves in wildly different ways. Here's the
              vendor-neutral checklist we use when evaluating any {acronym} platform:
            </p>
            <ul className="space-y-2.5">
              <Bullet>
                <strong>Engine coverage that maps to your customers.</strong> ChatGPT, Claude,
                Gemini, and Perplexity drive the bulk of meaningful AI search traffic in 2026.
                Tools that monitor more (Copilot, Grok) are valuable if your buyers actually
                use those engines — verify before paying for breadth you won't use.
              </Bullet>
              <Bullet>
                <strong>Output that ships to production, not just dashboards.</strong> A
                visibility chart tells you you're losing. Deployable JSON-LD and crawler-policy
                fixes help you act. Look for the verbs: "generate," "draft," "export."
              </Bullet>
              <Bullet>
                <strong>Transparent pricing.</strong> If a vendor won't show you a price page,
                their default contract is going to be five figures and an annual commitment.
                That's fine if you're an enterprise; brutal if you're a 3-person team.
              </Bullet>
              <Bullet>
                <strong>A real free or trial tier.</strong> {acronym} tooling is changing fast.
                Lock-in is risky. Pick vendors that let you actually try the product end-to-end
                without a sales call.
              </Bullet>
              <Bullet>
                <strong>Honest methodology.</strong> Beware tools that claim to "guarantee" AI
                ranking lifts or quote precise percent-improvement numbers. AI engines are
                non-deterministic and the academic GEO research only validates a couple of
                techniques. Anyone promising more is overselling.
              </Bullet>
            </ul>
          </section>

          {/* Category-based picks — the real value of this page */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900">Best {acronym} tool by use case</h2>
            <div className="space-y-3">
              {categoryPicks.map((cat, i) => (
                <Card key={cat.title} className="border-slate-200 hover:border-emerald-400 transition-colors">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start gap-4">
                      <div className="hidden sm:flex h-10 w-10 rounded-xl bg-emerald-50 items-center justify-center shrink-0">
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                              #{i + 1} · {cat.title}
                            </div>
                            <div className="text-lg font-bold text-slate-900 mt-0.5">{cat.pick}</div>
                            <div className="text-xs text-slate-500">Best for: {cat.bestFor}</div>
                          </div>
                          <Link href={cat.pickHref}>
                            <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                              {cat.pick === "AEO Improvement" ? "Get started" : "Read comparison"}
                              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                            </Button>
                          </Link>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{cat.reasoning}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Why we made AEO Improvement */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Why we built AEO Improvement</h2>
            <Card className="border-slate-200">
              <CardContent className="pt-6 pb-6 space-y-3 text-slate-700 leading-relaxed">
                <p>
                  Most tools in this category are built around a dashboard: how often you're
                  cited, what AI says about you, how you trend over time. That's useful — and
                  every serious team should track it. But dashboards don't change your AEO
                  score. <strong>Code on your site changes your AEO score.</strong>
                </p>
                <p>
                  We built the Fix Generator because we kept seeing the same pattern with our
                  own consulting clients: an audit would surface "no FAQPage schema, weak
                  Organization markup, blocked citation bots" — and the marketer would ask their dev
                  team for help, and the request would sit in a backlog for six weeks. So
                  we generate the file for you. Copy, paste, ship. Score moves.
                </p>
                <p>
                  We're cheaper than most competitors because we run lean and have a real
                  free tier so you can validate the product before paying anything. We don't
                  publish vanity metrics like "users see X% lift" because the academic
                  research doesn't support those numbers honestly — see our{" "}
                  <Link href="/methodology" className="text-emerald-600 hover:underline">
                    methodology page
                  </Link>{" "}
                  for the long version.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Bottom CTA */}
          <Card className="border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-white text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" /> Compare for yourself — start free
            </div>
            <CardContent className="pt-6 pb-6 space-y-4">
              <h3 className="text-2xl font-bold text-slate-900">Run a free {acronym} audit in 90 seconds</h3>
              <p className="text-slate-600 leading-relaxed">
                Paste your URL. We'll score your AEO citability and show your prioritized fixes.
                Your first month includes the deployable Fix Generator. No credit card.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white border-0 font-semibold"
                  onClick={() => setLocation("/")}
                >
                  Run a free audit <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setLocation(`/upgrade?source=best-${acronym.toLowerCase()}-tools`)}
                >
                  See Pro features <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <GuideSources />

          {/* Deep-dive comparisons */}
          <section className="space-y-3 pt-6 border-t border-slate-200">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Deep-dive comparisons
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {COMPETITORS.map((c) => (
                <Link
                  key={c.slug}
                  href={`/vs/${c.slug}`}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors text-center"
                >
                  vs {c.name}
                </Link>
              ))}
            </div>
            {!isGeo && (
              <div className="text-center pt-2">
                <Link href="/best-geo-optimization-tools" className="text-sm text-emerald-600 hover:underline">
                  Looking for the GEO version of this guide? →
                </Link>
              </div>
            )}
            {isGeo && (
              <div className="text-center pt-2">
                <Link href="/best-aeo-tools" className="text-sm text-emerald-600 hover:underline">
                  Looking for the AEO version of this guide? →
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-slate-700 leading-relaxed">
      <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

// Suppress unused-icon warning for icons reserved for future per-card variants.
export { Users };
