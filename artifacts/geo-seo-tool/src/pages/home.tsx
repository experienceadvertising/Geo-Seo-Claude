import React from "react";
import { Link, useLocation } from "wouter";
import { Search, Loader2, ArrowRight, BarChart3, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalyzeUrl, useListAudits } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ScoreBadge } from "@/components/score-badge";

export default function Home() {
  const [url, setUrl] = React.useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const analyze = useAnalyzeUrl();
  const auditsQuery = useListAudits({ limit: 10 });
  const audits = auditsQuery.data || [];

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    let targetUrl = url;
    if (!targetUrl.startsWith("http")) {
      targetUrl = `https://${targetUrl}`;
    }
    
    analyze.mutate(
      { data: { url: targetUrl } },
      {
        onSuccess: (result) => {
          setLocation(`/results/${result.id}`);
        },
        onError: (err) => {
          toast({
            title: "Analysis failed",
            description: err.error || "An error occurred while analyzing the URL.",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 space-y-12">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center space-y-6 py-12 md:py-24">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-4">
          Generative Engine Optimization
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Audit your visibility in <br className="hidden md:block"/> AI Search Engines.
        </h1>
        <p className="text-lg text-muted-foreground max-w-[600px]">
          Analyze how well your website is optimized for ChatGPT, Claude, and Perplexity. Get actionable insights to dominate AI-driven discovery.
        </p>

        <form onSubmit={handleAnalyze} className="w-full max-w-2xl mt-8 flex flex-col sm:flex-row gap-3">
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
      </section>

      {/* Market Stats */}
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

      {/* Recent Audits */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Recent Audits</h2>
        
        {auditsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />)}
          </div>
        ) : audits.length === 0 ? (
          <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
            No audits run yet. Enter a URL above to start.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {audits.map((audit) => (
              <Link key={audit.id} href={`/results/${audit.id}`} className="group flex items-center justify-between p-4 rounded-lg border bg-card hover:border-primary/50 transition-all cursor-pointer shadow-sm hover:shadow-md block">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-sm font-medium group-hover:text-primary transition-colors">{audit.url}</span>
                  <span className="text-xs text-muted-foreground">{new Date(audit.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">GEO Score</span>
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
