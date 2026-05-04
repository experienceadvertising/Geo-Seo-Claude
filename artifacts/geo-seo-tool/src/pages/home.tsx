import React from "react";
import { Link, useLocation } from "wouter";
import { Search, Loader2, ArrowRight, BarChart3, TrendingUp, TrendingDown, Minus, Zap, Shield, Lock, Sparkles, CheckCircle2, BookOpen, Lightbulb, ExternalLink, Globe, FileCode, Building2, Bot } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyzeUrl, useListAudits } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ScoreBadge } from "@/components/score-badge";
import { usePlan } from "@/hooks/usePlan";
import { AuthoritySignalsCard } from "@/components/authority-signals-card";
import heroImage from "@/assets/hero.png";

function MarketStats() {
  // Qualitative value-prop trio. Earlier versions of this section displayed
  // unsourced "+527%", "4.4x", "Top 10% / 90%" stat cards with disclaimers
  // about being "benchmark estimates" — those numbers had no traceable
  // primary source and were removed as part of the Phase 2 source-every-claim
  // migration. The case for AEO holds without them; we make the case
  // qualitatively here and let the audit itself produce the per-page numbers.
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Where attention is moving</CardDescription>
          <CardTitle className="text-xl leading-snug">AI search is becoming a discovery channel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">ChatGPT, Claude, Perplexity, and Google AI Overviews now answer queries that used to start a 10-blue-link search session. If your page isn't shaped to be cited, you're invisible in that flow.</p>
        </CardContent>
      </Card>
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Why the visits matter</CardDescription>
          <CardTitle className="text-xl leading-snug">AI-referred visitors arrive with intent</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">A user clicking a citation inside an AI answer has already read a recommendation about you. They land further down the funnel than someone scanning a list of search results.</p>
        </CardContent>
      </Card>
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> What we measure</CardDescription>
          <CardTitle className="text-xl leading-snug">A score that maps to citation behavior</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Our AEO score is a composite of citability, AI-crawler access, brand authority, schema, and technical SEO — each tied to a recommendation with its source disclosed.</p>
        </CardContent>
      </Card>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative w-full aspect-[4/3] max-w-xl mx-auto lg:mx-0">
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-emerald-500/30 via-teal-400/20 to-cyan-400/30 blur-3xl rounded-full animate-pulse-slow" />
      <div className="relative rounded-3xl overflow-hidden border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 bg-card animate-float">
        <img
          src={heroImage}
          alt="AEO Improvement — AI search engine optimization visualization"
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
      </div>
      <div className="hidden md:flex absolute -bottom-4 -left-4 lg:-left-8 items-center gap-3 bg-card border shadow-xl rounded-2xl px-4 py-3 animate-float-delayed">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
          92
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">AEO Score</span>
          <span className="text-sm font-semibold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Excellent
          </span>
        </div>
      </div>
      <div className="hidden md:flex absolute -top-4 -right-4 lg:-right-8 items-center gap-2 bg-card border shadow-xl rounded-full px-4 py-2 animate-float">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping-slow" />
        <span className="text-xs font-semibold">GPTBot · ClaudeBot · PerplexityBot</span>
      </div>
    </div>
  );
}

function SignedOutLanding() {
  return (
    <div className="flex-1 w-full">
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/40 dark:via-background dark:to-teal-950/40" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-emerald-400/20 blur-[120px]" />
          <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-teal-400/20 blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.08]" style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }} />
        </div>

        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 backdrop-blur-sm">
                <Sparkles className="h-3 w-3" /> Answer Engine Optimization
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
                Get cited by{" "}
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  ChatGPT, Claude
                </span>
                {" "}& Perplexity.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-[560px]">
                Score your website's citability across every major AI search engine and get
                personalized recommendations with transparent sources to climb the rankings.
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-foreground/80 max-w-md">
                {["Real AI engine prompts", "Schema & crawler audits", "Personalized fixes", "Free to start"].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <Link href="/sign-up">
                  <Button size="lg" className="h-12 px-8 font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25">
                    Audit my site — it's free <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="h-12 px-8 font-semibold border-emerald-500/30 hover:bg-emerald-500/10">
                    Sign in
                  </Button>
                </Link>
              </div>
              <div className="flex flex-col items-center lg:items-start gap-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> Free account required. No credit card.
                </p>
                <Link href="/pricing" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                  See all plans &amp; pricing →
                </Link>
              </div>
            </div>
            <HeroVisual />
          </div>
        </div>
      </section>

      <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-16 space-y-12">
        <MarketStats />
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary"/>Crawler & schema audits</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">See exactly which AI bots can read your site and which schema types you're missing.</CardContent>
          </Card>
          <Card className="border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-primary"/>JavaScript rendering check</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">Detects SPA-only content that AI crawlers can't see.</CardContent>
          </Card>
          <Card className="border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary"/>Live prompt simulation</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">Run real prompts through 4 AI engines to see if and how your brand gets mentioned.</CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

const ANALYSIS_STEPS = [
  "Fetching page",
  "Analyzing content",
  "Checking crawlers",
  "Computing scores",
  "Generating insights",
];

function AnalysisProgress({ stage }: { stage?: number }) {
  const [elapsedStage, setElapsedStage] = React.useState(0);

  React.useEffect(() => {
    if (typeof stage === "number") return;
    const durations = [3000, 6000, 5000, 6000, 8000];
    let idx = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    function advance() {
      idx++;
      if (idx < ANALYSIS_STEPS.length - 1) {
        setElapsedStage(idx);
        timers.push(setTimeout(advance, durations[idx]));
      } else {
        setElapsedStage(ANALYSIS_STEPS.length - 1);
      }
    }
    timers.push(setTimeout(advance, durations[0]));
    return () => timers.forEach(clearTimeout);
  }, [stage]);

  const step = typeof stage === "number"
    ? Math.max(0, Math.min(stage, ANALYSIS_STEPS.length - 1))
    : elapsedStage;

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="flex flex-col items-center gap-3 w-full max-w-sm">
        {ANALYSIS_STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={label} className={`flex items-center gap-3 text-sm transition-all ${done ? "text-primary" : active ? "text-foreground font-semibold" : "text-muted-foreground/40"}`}>
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              ) : active ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-current shrink-0" />
              )}
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// "Your AEO Journey" surface — the first thing a returning user sees on the
// dashboard once they have ≥1 audit. It does three jobs:
//   (1) Reflects current state: latest score + delta vs the prior audit on
//       the same domain, so the dashboard *itself* tells a progression
//       story instead of being just a launcher form.
//   (2) Renders a tiny inline sparkline of the last 5 audits — gives a felt
//       sense of trajectory without requiring users to open results pages.
//   (3) For free users, embeds a compact "What Pro unlocks for YOUR site"
//       row showing three locked previews tied to their actual data — much
//       higher-conversion than abstract feature lists on /pricing.
function AeoJourneyCard({ audits }: { audits: Array<{ id: number; url: string; geoScore: number; createdAt: string }> }) {
  const { isFree } = usePlan();
  // Audits are returned newest-first by /api/geo/audits.
  const latest = audits[0];
  // Find the most recent prior audit on the SAME hostname so the delta is
  // a meaningful "this site moved X" — not "your last audit on a totally
  // different site scored Y". Falls back to chronological prior if hostname
  // parse fails.
  const latestHost = (() => { try { return new URL(latest.url).hostname; } catch { return null; } })();
  const prior = audits.slice(1).find((a) => {
    if (!latestHost) return false;
    try { return new URL(a.url).hostname === latestHost; } catch { return false; }
  }) ?? audits[1];

  // /api/geo/audits returns geoScore as the DB-stored real value, which is
  // already on a 0-100 scale (the analyzer does Math.round of the weighted
  // sub-scores before insert). Display directly — no *100. Note: the
  // "Recent audits" list below this card multiplies by 100, which is a
  // pre-existing display bug in that section; tracked separately so this
  // PR stays scoped to the journey/email work.
  const currScore = Math.round(latest.geoScore);
  const priorScore = prior ? Math.round(prior.geoScore) : null;
  const delta = priorScore != null ? currScore - priorScore : null;

  // Sparkline: last 5 audits, oldest → newest, on this hostname if there
  // are enough; otherwise the global recency window. Plain inline SVG —
  // no chart library dependency for a 5-point trendline.
  const sparkAudits = (() => {
    if (latestHost) {
      const sameHost = audits.filter((a) => {
        try { return new URL(a.url).hostname === latestHost; } catch { return false; }
      });
      if (sameHost.length >= 2) return sameHost.slice(0, 5).reverse();
    }
    return audits.slice(0, 5).reverse();
  })();
  const sparkValues = sparkAudits.map((a) => Math.round(a.geoScore));
  const sparkMin = Math.min(...sparkValues, 0);
  const sparkMax = Math.max(...sparkValues, 100);
  const sparkRange = sparkMax - sparkMin || 1;
  const sparkPath = sparkValues.length >= 2
    ? sparkValues.map((v, i) => {
        const x = (i / (sparkValues.length - 1)) * 100;
        const y = 30 - ((v - sparkMin) / sparkRange) * 28;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(" ")
    : null;

  const DeltaIcon = delta == null ? Minus : delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaColor = delta == null || delta === 0
    ? "text-muted-foreground"
    : delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400";

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-600" /> Your AEO journey
        </CardTitle>
        <CardDescription className="text-xs">
          {latestHost ? `Tracking ${latestHost}` : "Latest audit"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-3xl font-bold tabular-nums">{currScore}<span className="text-base text-muted-foreground font-normal">/100</span></div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Current AEO score</div>
            </div>
            {delta != null && (
              <div className={`flex items-center gap-1 text-sm font-semibold ${deltaColor}`}>
                <DeltaIcon className="h-4 w-4" />
                {delta > 0 ? `+${delta}` : delta}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  vs prior {priorScore != null ? `(${priorScore})` : ""}
                </span>
              </div>
            )}
          </div>
          {sparkPath && (
            <svg viewBox="0 0 100 30" className="h-10 w-32 overflow-visible" preserveAspectRatio="none" aria-hidden="true">
              <path d={sparkPath} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-500" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              {sparkValues.map((v, i) => {
                const x = (i / (sparkValues.length - 1)) * 100;
                const y = 30 - ((v - sparkMin) / sparkRange) * 28;
                return <circle key={i} cx={x} cy={y} r="1.5" className="fill-emerald-500" vectorEffect="non-scaling-stroke" />;
              })}
            </svg>
          )}
        </div>

        <Link href={`/results/${latest.id}`}>
          <Button size="sm" variant="outline" className="border-emerald-500/30 hover:bg-emerald-500/10">
            Open latest audit <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        </Link>

        {/* Free-only: compact "what Pro unlocks for YOUR site" preview row.
            Three locked-state tiles tied to features the user has already
            seen referenced (multi-engine simulation, Fix Generator,
            competitor citation gaps). Each tile communicates the value
            specifically — not as an abstract feature list. */}
        {isFree && (
          <div className="pt-4 border-t border-emerald-500/10">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> Pro unlocks for {latestHost || "this site"}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Link href="/pricing">
                <div className="rounded-lg border border-dashed border-muted-foreground/20 p-3 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors cursor-pointer h-full">
                  <div className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-emerald-600" /> All 4 engines
                  </div>
                  <div className="text-xs text-muted-foreground leading-snug">See how Claude, Gemini & Perplexity cite you — not just ChatGPT.</div>
                </div>
              </Link>
              <Link href="/pricing">
                <div className="rounded-lg border border-dashed border-muted-foreground/20 p-3 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors cursor-pointer h-full">
                  <div className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-emerald-600" /> Fix Generator
                  </div>
                  <div className="text-xs text-muted-foreground leading-snug">Auto-draft your llms.txt, JSON-LD & robots.txt — copy and ship.</div>
                </div>
              </Link>
              <Link href="/pricing">
                <div className="rounded-lg border border-dashed border-muted-foreground/20 p-3 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors cursor-pointer h-full">
                  <div className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <Shield className="h-3 w-3 text-emerald-600" /> Competitor gaps
                  </div>
                  <div className="text-xs text-muted-foreground leading-snug">Find which rivals AI engines cite instead of you, and why.</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Curated set of practitioner AEO/GEO tips. Each one is a qualitative,
// widely-accepted strategy — NO invented numbers, NO fabricated stats. The
// library is intentionally small (one tip per day-of-year rotation) so each
// surface is sharp and re-reading is fine. If you add or reorder entries,
// the rotation index is stable per-day, so users see the same tip across
// page-loads on the same UTC day.
const AEO_TIPS: Array<{ icon: string; title: string; body: string }> = [
  {
    icon: "🤖",
    title: "Verify AI crawlers can reach you",
    body: "GPTBot, ClaudeBot, PerplexityBot, and Google-Extended each obey robots.txt. A single overly-broad Disallow can hide your whole site from AI search. View your robots.txt and explicitly Allow these user-agents on the paths that matter.",
  },
  {
    icon: "📄",
    title: "Publish an llms.txt at your root",
    body: "An llms.txt is a plain-text manifest at /llms.txt that tells LLMs which pages to prioritise and how to summarise your brand. It's emerging as a de-facto standard — early adoption is cheap and signals intent to rank in AI answers.",
  },
  {
    icon: "❓",
    title: "Add FAQPage JSON-LD to high-intent pages",
    body: "AI answer engines lift FAQ markup directly into responses. Pick your top product or pricing page, write 5–8 questions in your customers' actual phrasing, and wrap them in FAQPage schema. The format is dead simple and the leverage is large.",
  },
  {
    icon: "📝",
    title: "Lead with the answer, not the build-up",
    body: "AI engines extract paragraphs that resolve a question in 2–3 sentences. Audit your top pages: does the first paragraph after each H2 directly answer the heading? If it sets up context first, rewrite — answer first, context after.",
  },
  {
    icon: "🏷️",
    title: "Disambiguate your brand entity",
    body: "If your brand name is a common word (or shares a name with anything else), AI engines may confuse you with someone else. Add Organization JSON-LD with sameAs links to your Wikipedia, LinkedIn, Crunchbase, and X profiles to anchor the entity.",
  },
  {
    icon: "⚡",
    title: "Make sure your content survives without JS",
    body: "Most AI crawlers do not execute JavaScript reliably. Right-click → View Source on your top page. If the body is mostly empty divs, your content is invisible to AI. Server-side render or pre-render at least the first viewport's content.",
  },
  {
    icon: "🔗",
    title: "Earn citations from sources LLMs already trust",
    body: "AI engines weight sources their training data already knows. A mention on Wikipedia, a respected industry trade publication, or a well-cited research paper does more for AI visibility than ten link-farm backlinks ever will.",
  },
  {
    icon: "📰",
    title: "Keep your About page boring and factual",
    body: "AI engines pull company facts — founders, founding year, HQ location, headcount range, what you do — from About pages. Make them findable in plain text on a single page, not buried in a video or an interactive timeline.",
  },
];

// Curated external resources. ONLY include stable, authoritative URLs from
// publishers we'd be comfortable being seen alongside. No paid blogs, no
// affiliate links, no rotating "best of" lists. If a URL ever 404s, swap
// it for a stable doc-root from the same publisher rather than a workaround.
const TRUSTED_RESOURCES: Array<{ source: string; title: string; description: string; url: string }> = [
  {
    source: "Google Search Central",
    title: "AI features & your website",
    description: "Google's official guidance on how AI Overviews surface and cite content. The canonical reference.",
    url: "https://developers.google.com/search/docs/appearance/ai-features",
  },
  {
    source: "OpenAI",
    title: "Search & GPTBot crawler docs",
    description: "How ChatGPT search retrieves and cites pages, plus the GPTBot user-agent spec for your robots.txt.",
    url: "https://platform.openai.com/docs/bots",
  },
  {
    source: "Anthropic",
    title: "ClaudeBot & web search",
    description: "Anthropic's docs on how Claude reaches the open web and which user-agents to allow.",
    url: "https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/web-search-tool",
  },
  {
    source: "Schema.org",
    title: "Full vocabulary reference",
    description: "Authoritative source for every schema type AI engines parse — FAQPage, Organization, Product, HowTo, and more.",
    url: "https://schema.org/docs/schemas.html",
  },
  {
    source: "Search Engine Land",
    title: "AI search coverage hub",
    description: "Daily reporting on AI search platforms, ranking shifts, and practitioner tactics.",
    url: "https://searchengineland.com/library/platforms/ai-search",
  },
  {
    source: "Aleyda Solis",
    title: "LearningSEO — AI search resources",
    description: "Curated, vendor-neutral reading list maintained by one of SEO's most respected practitioners.",
    url: "https://www.learningseo.io/",
  },
];

// Quick wins users can do RIGHT NOW without running an audit. Drives
// engagement on the empty-state dashboard and gives returning users
// a checklist they can come back to between re-audits. All actions are
// concrete and verifiable on the user's own site.
const QUICK_WINS: string[] = [
  "Open your robots.txt and confirm it doesn't block GPTBot, ClaudeBot, PerplexityBot, or Google-Extended.",
  "View Source on your homepage — your value prop and key claims should appear in the raw HTML, not after a JS render.",
  "Add FAQPage JSON-LD to your single highest-traffic page first. Validate with Google's Rich Results Test.",
  "Create a one-page llms.txt at your root listing your most important URLs. Even a minimal version helps.",
  "Add Organization schema with sameAs links to your Wikipedia, LinkedIn, Crunchbase, and X profiles.",
];

// Companion learning surface to the journey card. The dashboard, even for
// users with audit history, is too utilitarian on its own — this section
// gives them something to read, do, and click into between audits, and
// gives empty-state users an actual reason to return tomorrow.
function DashboardLearningHub() {
  // Stable per-UTC-day rotation. Index doesn't shift across page-loads on
  // the same day, so users aren't disoriented by the tip changing under them.
  const todayTip = React.useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 1)) / 86_400_000);
    return AEO_TIPS[dayOfYear % AEO_TIPS.length];
  }, []);

  return (
    <div className="space-y-6">
      {/* Daily tip — single, focused, scannable. The icon + title alone
          should communicate the actionable takeaway in <2 seconds. */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-emerald-600" />
            Today's AEO play
          </div>
          <CardTitle className="text-lg flex items-center gap-2 mt-1">
            <span aria-hidden="true">{todayTip.icon}</span>
            <span>{todayTip.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{todayTip.body}</p>
        </CardContent>
      </Card>

      {/* Trusted resources — externally credible and stable. We deliberately
          surface SOURCE first, then title, so users recognise the publisher
          (Google, OpenAI, Anthropic) before deciding to click. */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            From the source
          </h2>
          <p className="text-xs text-muted-foreground hidden sm:block">High-authority AEO references</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TRUSTED_RESOURCES.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-lg border bg-card p-4 hover:border-emerald-500/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                    {r.source}
                  </div>
                  <div className="text-sm font-medium mt-0.5 truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-snug">{r.description}</div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-600 flex-shrink-0 mt-0.5" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Authority signals — off-site moves that AI engines weight heavily
          (Linkby paid placements, HARO, podcasts, Wikipedia, Reddit, YouTube).
          Lives in the hub because these are evergreen recommendations,
          not audit-derived. */}
      <AuthoritySignalsCard />

      {/* Quick wins checklist — concrete, ungated by an audit. Every item
          is something a competent operator can do today on their own site. */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Quick wins (no audit required)
          </CardTitle>
          <CardDescription className="text-xs">
            Five things you can ship today that move every AEO score we measure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {QUICK_WINS.map((win, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {i + 1}
                </div>
                <span className="text-muted-foreground leading-relaxed">{win}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function SignedInDashboard() {
  const [url, setUrl] = React.useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const firstName = user?.firstName;

  const { data: audits, isLoading: auditsLoading } = useListAudits();
  const analyzeUrl = useAnalyzeUrl();
  const queryClient = useQueryClient();

  // Post-checkout success handling. Stripe redirects successful upgrades to
  // `/?checkout=success` so users land on their dashboard (where they can
  // immediately use what they just paid for) instead of back on /pricing.
  // We invalidate the plan/me/subscription queries so the new entitlement
  // shows up without a manual refresh, fire a confirmation toast, then strip
  // the query param so a refresh doesn't re-trigger the toast.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "success") return;
    queryClient.invalidateQueries({ queryKey: ["me", "plan"] });
    queryClient.invalidateQueries({ queryKey: ["stripe", "subscription"] });
    queryClient.invalidateQueries({ queryKey: ["me"] });
    toast({
      title: "You're upgraded — welcome aboard",
      description: "Your new plan is active. All engines, deeper audits, and the full recommendation set are unlocked.",
    });
    setLocation("/", { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    let normalized = trimmed;
    if (!/^https?:\/\//.test(normalized)) normalized = "https://" + normalized;
    analyzeUrl.mutate({ data: { url: normalized } }, {
      onSuccess: (data: any) => {
        setLocation(`/results/${data.id}`);
      },
      onError: (err: any) => {
        toast({
          title: "Audit failed",
          description: err?.message || "Could not analyze this URL. Check it's accessible and try again.",
          variant: "destructive",
        });
      },
    });
  }

  const greeting = firstName ? `Welcome back, ${firstName}` : "Welcome back";

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-14 space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground">Run an AEO audit to see how your site performs in AI search.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10 h-11 text-base"
            placeholder="https://yourwebsite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={analyzeUrl.isPending}
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={analyzeUrl.isPending || !url.trim()}
          className="h-11 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/25"
        >
          {analyzeUrl.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>Audit <ArrowRight className="ml-1 h-4 w-4" /></>
          )}
        </Button>
      </form>

      {analyzeUrl.isPending && <AnalysisProgress />}

      {!analyzeUrl.isPending && audits && audits.length > 0 && (
        <AeoJourneyCard audits={audits} />
      )}

      {!analyzeUrl.isPending && <DashboardLearningHub />}

      {!analyzeUrl.isPending && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent audits</h2>
          {auditsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : !audits || audits.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center space-y-4">
                <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground">No audits yet. Enter a URL above to get your first AEO score.</p>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground/70">Or try one of these</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {(() => {
                      const samples = ["stripe.com", "notion.so", "anthropic.com"];
                      const userDomain = user?.email?.split("@")[1];
                      const chips = userDomain && !["gmail.com","yahoo.com","outlook.com","hotmail.com","icloud.com"].includes(userDomain)
                        ? [userDomain, ...samples.slice(0, 2)]
                        : samples;
                      return chips.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setUrl(d)}
                          className="rounded-full border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 transition-colors"
                        >
                          {d}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {audits.map((audit: any) => (
                <Link key={audit.id} href={`/results/${audit.id}`}>
                  <Card className="cursor-pointer hover:border-emerald-500/30 hover:shadow-md transition-all">
                    <CardContent className="py-4 flex items-center justify-between gap-4">
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm truncate">{audit.url}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(audit.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <ScoreBadge score={Math.round(audit.geoScore * 100)} size="sm" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <SignedOutLanding />;
  return <SignedInDashboard />;
}
