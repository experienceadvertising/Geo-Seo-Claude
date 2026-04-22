import React from "react";
import { Link, useLocation } from "wouter";
import { Search, Loader2, ArrowRight, BarChart3, TrendingUp, Zap, Shield, Lock } from "lucide-react";
import { Show, SignInButton, SignUpButton, useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyzeUrl, useListAudits } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ScoreBadge } from "@/components/score-badge";

function MarketStats() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> AI Traffic</CardDescription>
          <CardTitle className="text-3xl">+527%</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">YoY growth in traffic from LLMs and AI search engines.</p>
        </CardContent>
      </Card>
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> AI Conversion</CardDescription>
          <CardTitle className="text-3xl">4.4x</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Higher conversion rate compared to traditional search traffic.</p>
        </CardContent>
      </Card>
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardDescription className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Citability</CardDescription>
          <CardTitle className="text-3xl">Top 10%</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">of pages capture 90% of all AI citations. Optimization matters.</p>
        </CardContent>
      </Card>
    </section>
  );
}

function SignedOutLanding() {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 space-y-12">
      <section className="flex flex-col items-center text-center space-y-6 py-12 md:py-24">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary/10 text-primary mb-4">
          Answer Engine Optimization
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Get cited by <br className="hidden md:block"/> ChatGPT, Claude & Perplexity.
        </h1>
        <p className="text-lg text-muted-foreground max-w-[640px]">
          AEO Improvement scores your website's citability across every major AI search engine
          and tells you exactly what to change — backed by 2026 research, personalized to your URL.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <SignUpButton mode="modal">
            <Button size="lg" className="h-12 px-8 font-semibold">
              Get started — it's free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </SignUpButton>
          <SignInButton mode="modal">
            <Button size="lg" variant="outline" className="h-12 px-8 font-semibold">
              Sign in
            </Button>
          </SignInButton>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
          <Lock className="h-3 w-3" /> Free account required to run audits and view your history.
        </p>
      </section>
      <MarketStats />
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary"/>Crawler & schema audits</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">See exactly which AI bots can read your site and which schema types you're missing.</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-primary"/>JavaScript rendering check</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Detects SPA-only content that AI crawlers can't see.</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary"/>Live prompt simulation</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Run real prompts through 4 AI engines to see if and how your brand gets mentioned.</CardContent></Card>
      </section>
    </div>
  );
}

function SignedInDashboard() {
  const [url, setUrl] = React.useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();

  const analyze = useAnalyzeUrl();
  const auditsQuery = useListAudits({ limit: 10 });
  const audits = auditsQuery.data || [];

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    let targetUrl = url;
    if (!targetUrl.startsWith("http")) targetUrl = `https://${targetUrl}`;
    analyze.mutate(
      { data: { url: targetUrl } },
      {
        onSuccess: (result) => setLocation(`/results/${result.id}`),
        onError: (err: any) => {
          toast({
            title: "Analysis failed",
            description: err?.error || "An error occurred while analyzing the URL.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : "Welcome back";

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 space-y-12">
      <section className="flex flex-col items-center text-center space-y-6 py-12 md:py-16">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-primary/10 text-primary mb-4">
          {greeting}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Audit any URL for <br className="hidden md:block"/> AI search visibility.
        </h1>
        <form onSubmit={handleAnalyze} className="w-full max-w-2xl mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://example.com"
              className="pl-10 h-12 text-base font-mono bg-card"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={analyze.isPending}
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-8 font-semibold" disabled={analyze.isPending}>
            {analyze.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</>
            ) : (
              <>Scan URL <ArrowRight className="ml-2 h-5 w-5" /></>
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">Limit: 20 audits per hour per account.</p>
      </section>

      <MarketStats />

      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Your Recent Audits</h2>
        {auditsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />)}
          </div>
        ) : audits.length === 0 ? (
          <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
            No audits yet. Enter a URL above to run your first scan.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {audits.map((audit) => (
              <Link key={audit.id} href={`/results/${audit.id}`} className="group flex items-center justify-between p-4 rounded-lg border bg-card hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-sm font-medium group-hover:text-primary transition-colors">{audit.url}</span>
                  <span className="text-xs text-muted-foreground">{new Date(audit.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">AEO Score</span>
                    <ScoreBadge score={audit.geoScore} className="text-sm px-3 py-1" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Show when="signed-in"><SignedInDashboard /></Show>
      <Show when="signed-out"><SignedOutLanding /></Show>
    </>
  );
}
