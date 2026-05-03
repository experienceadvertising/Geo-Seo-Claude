import React from "react";
import { Link, useLocation } from "wouter";
import { Search, Loader2, ArrowRight, BarChart3, TrendingUp, Zap, Shield, Lock, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyzeUrl, useListAudits } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ScoreBadge } from "@/components/score-badge";
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
