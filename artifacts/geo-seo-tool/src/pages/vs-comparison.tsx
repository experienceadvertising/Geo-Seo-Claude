import { Link, useRoute, useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Minus,
  HelpCircle,
  Zap,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NotFound from "@/pages/not-found";
import { SEO } from "@/components/seo";
import { COMPETITORS, SHARED_ROWS, getCompetitor, OUR_FACTS } from "@/data/competitors";

/**
 * Single parameterized page that renders the AEO Improvement vs <competitor>
 * comparison for any slug in the COMPETITORS data table. One file, one
 * route registration, scales to N competitors.
 *
 * SEO strategy:
 * - Targeted H1 with the "[us] vs [them]" comparison keyword pattern
 * - Indexable canonical at /vs/<slug>
 * - JSON-LD: ComparisonTable (FAQPage flavor) + BreadcrumbList
 * - Internal links to /upgrade with source param for attribution
 * - Honest framing — we surface things competitors do BETTER too, which
 *   builds trust and gets us more clicks from informed buyers (and
 *   massively reduces legal risk vs claiming "X is worse").
 */
export default function VsComparison() {
  const [, params] = useRoute("/vs/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug ?? "";
  const c = getCompetitor(slug);

  if (!c) return <NotFound />;

  const upgradeHref = `/upgrade?source=vs-${c.slug}`;

  // FAQPage schema — Google will sometimes show these as expandable rich
  // results in SERP, which dramatically lifts CTR for comparison queries.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How does AEO Improvement compare to ${c.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${c.oneLiner} AEO Improvement adds an automated Fix Generator for JSON-LD and citation-bot robots.txt entries on top of monitoring, with self-serve pricing starting at ${OUR_FACTS.proPrice} and a free tier of ${OUR_FACTS.freeTier}.`,
        },
      },
      {
        "@type": "Question",
        name: `What does ${c.name} cost?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: c.pricingNote,
        },
      },
      {
        "@type": "Question",
        name: `Which AI engines does ${c.name} monitor?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${c.name} monitors ${c.theirEngines.join(", ")}. AEO Improvement runs prompt simulations against ChatGPT, Claude, Gemini, and Perplexity.`,
        },
      },
      {
        "@type": "Question",
        name: `When should I pick AEO Improvement over ${c.name}?`,
        acceptedAnswer: { "@type": "Answer", text: c.whenToPickUs },
      },
      {
        "@type": "Question",
        name: `When should I pick ${c.name} over AEO Improvement?`,
        acceptedAnswer: { "@type": "Answer", text: c.whenToPickThem },
      },
    ],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://aeoimprovement.com/" },
      { "@type": "ListItem", position: 2, name: "Comparisons", item: "https://aeoimprovement.com/best-aeo-tools" },
      { "@type": "ListItem", position: 3, name: `vs ${c.name}`, item: `https://aeoimprovement.com/vs/${c.slug}` },
    ],
  };

  return (
    <>
      <SEO title={c.title} description={c.description} path={`/vs/${c.slug}`} jsonLd={[faqJsonLd, breadcrumbJsonLd]} />
      <div className="min-h-[calc(100vh-4rem)] py-10 px-4 bg-gradient-to-b from-slate-50/60 to-white">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Breadcrumb */}
          <Link href="/best-aeo-tools" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /> All AEO tool comparisons
          </Link>

          {/* Hero */}
          <header className="space-y-4">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border px-3 py-1 text-xs font-semibold">
              Honest comparison · Updated 2026
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              AEO Improvement vs {c.name}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
              {c.oneLiner}
            </p>
            <p className="text-base text-slate-700 leading-relaxed max-w-3xl">
              <strong>AEO Improvement</strong> takes a different approach: alongside the visibility
              tracking, we generate the actual technical fixes — your FAQPage JSON-LD, Organization
              schema, and citation-bot robots.txt entries. Less "you should fix this,"
              more "here's the file, paste it." Plus a self-serve free tier so you can evaluate
              without a sales call.
            </p>
          </header>

          {/* TL;DR table */}
          <Card className="border-slate-200">
            <CardContent className="pt-6 pb-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                The 30-second answer
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Pick AEO Improvement if…
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{c.whenToPickUs}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                  <div className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                    <ExternalLink className="h-4 w-4" /> Pick {c.name} if…
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{c.whenToPickThem}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing fact */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-2.5">
            <HelpCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <strong>Pricing note:</strong> {c.pricingNote} AEO Improvement publishes prices openly:
              free tier, {OUR_FACTS.proPrice} for Pro, {OUR_FACTS.agencyPrice} for Agency.
            </div>
          </div>

          {/* Detailed feature comparison table */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Feature-by-feature comparison</h2>
            <p className="text-sm text-slate-600">
              Every "{c.name}" answer in this table is sourced from {c.name}'s public marketing
              pages. Where they don't advertise a feature, we say "Not advertised" rather than
              guess — talk to them directly to confirm anything ambiguous.
            </p>
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <div className="col-span-4 px-4 py-3">Feature</div>
                <div className="col-span-4 px-4 py-3 bg-emerald-50/50 border-l border-r border-emerald-100 text-emerald-800">
                  AEO Improvement
                </div>
                <div className="col-span-4 px-4 py-3">{c.name}</div>
              </div>
              {SHARED_ROWS.map((row) => {
                const adv = row.advantage[c.slug] ?? "neutral";
                return (
                  <div key={row.feature} className="grid grid-cols-12 border-b border-slate-100 last:border-b-0 text-sm">
                    <div className="col-span-4 px-4 py-3.5 font-medium text-slate-900">{row.feature}</div>
                    <div className={`col-span-4 px-4 py-3.5 border-l border-r border-emerald-100 ${adv === "us" ? "bg-emerald-50/50" : ""}`}>
                      <div className="flex items-start gap-1.5">
                        <AdvantageIcon advantage={adv === "us" ? "win" : adv === "them" ? "neutral" : "neutral"} />
                        <span className="text-slate-800">{row.us}</span>
                      </div>
                    </div>
                    <div className={`col-span-4 px-4 py-3.5 ${adv === "them" ? "bg-emerald-50/50" : ""}`}>
                      <div className="flex items-start gap-1.5">
                        <AdvantageIcon advantage={adv === "them" ? "win" : adv === "unknown" ? "unknown" : "neutral"} />
                        <span className="text-slate-700">{row.theirAnswers[c.slug]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Their strengths — honest acknowledgement */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">What {c.name} does well</h2>
            <p className="text-sm text-slate-600">
              We're not trying to talk you out of {c.name} if it's the right fit. Here's what they
              advertise as strengths on their own site.
            </p>
            <ul className="space-y-2.5">
              {c.theirStrengths.map((s) => (
                <li key={s} className="flex items-start gap-2.5">
                  <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700">{s}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Where we win */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Where AEO Improvement wins for most teams</h2>
            <ul className="space-y-3">
              <WinItem title="The Fix Generator">
                Audits tell you what's wrong. We also draft the fix. <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">FAQPage</code> JSON-LD,
                Organization schema, and citation-bot robots.txt entries are ready to copy and deploy.
              </WinItem>
              <WinItem title="A real free tier — not just a demo">
                {OUR_FACTS.freeTier}. Sign up, run an audit in 90 seconds, no credit card.
                Most competitors at this scope require a sales conversation.
              </WinItem>
              <WinItem title="Transparent, self-serve pricing">
                {OUR_FACTS.proPrice}. No demo required, no annual commitment, cancel from your
                dashboard. Most enterprise tools in this space publish nothing about price.
              </WinItem>
              <WinItem title="Four engines that matter, simulated end-to-end">
                We run your prompts through {OUR_FACTS.engines} and show you side-by-side
                whether each engine cites you, your competitors, or neither — per prompt, per engine.
              </WinItem>
            </ul>
          </section>

          {/* Bottom CTA */}
          <Card className="border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-white text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4" /> Try it free — see how it compares yourself
            </div>
            <CardContent className="pt-6 pb-6 space-y-4">
              <h3 className="text-2xl font-bold text-slate-900">
                Run a free AEO audit in 90 seconds
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Paste your URL. We'll run an audit against ChatGPT, score your AEO citability,
                and show you the top fixes, including deployable JSON-LD and crawler policy entries.
                Free plan is {OUR_FACTS.freeTier}. No credit card.
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
                  onClick={() => setLocation(upgradeHref)}
                >
                  See Pro features <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Other comparisons */}
          <section className="space-y-3 pt-6 border-t border-slate-200">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              See other comparisons
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {COMPETITORS.filter((o) => o.slug !== c.slug).map((o) => (
                <Link
                  key={o.slug}
                  href={`/vs/${o.slug}`}
                  className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors text-center"
                >
                  vs {o.name}
                </Link>
              ))}
            </div>
            <div className="text-center pt-2">
              <Link href="/best-aeo-tools" className="text-sm text-emerald-600 hover:underline">
                See our full Best AEO Tools 2026 guide →
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function WinItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="font-bold text-slate-900 mb-1.5">{title}</div>
      <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
    </li>
  );
}

function AdvantageIcon({ advantage }: { advantage: "win" | "neutral" | "unknown" }) {
  if (advantage === "win") return <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />;
  if (advantage === "unknown") return <HelpCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />;
  return <Minus className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />;
}

// Re-export X/Plus to silence unused warnings if these icons are removed —
// they're imported above for potential future "advantage: them" rendering.
export { X };
