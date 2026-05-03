import React, { useMemo, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetAudit, getGetAuditQueryKey, useAnalyzeUrl, customFetch } from "@workspace/api-client-react";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Bot, TerminalSquare, FileText, Code2, ShieldAlert, Sparkles, Loader2, Download, Building2, RefreshCw, TrendingUp, Wrench, Lock, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScoreBadge } from "@/components/score-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

/** Lowercase only the hostname portion of a URL while preserving path/query/casing.
 * "https://Stripe.com/Pricing?Q=A" → "https://stripe.com/Pricing?Q=A". */
function displayUrl(u: string): string {
  try {
    const parsed = new URL(u);
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString().replace(/\/$/, parsed.pathname === "/" && !u.endsWith("/") ? "" : "/");
  } catch { return u.replace(/^(https?:\/\/)([^/]+)/i, (_, p, h) => p + h.toLowerCase()); }
}
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { usePlan } from "@/hooks/usePlan";
import { UpgradePrompt } from "@/components/upgrade-prompt";

export default function Results() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const reRun = useAnalyzeUrl();
  const { isPro } = usePlan();
  const [showFixes, setShowFixes] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data: audit, isLoading, isError } = useGetAudit(id, {
    query: {
      enabled: !!id,
      queryKey: getGetAuditQueryKey(id)
    }
  });

  const chartData = useMemo(() => {
    if (!audit) return [];
    return [
      { subject: 'Citability', A: audit.scores.citability, fullMark: 100 },
      { subject: 'Brand Authority', A: audit.scores.brandAuthority, fullMark: 100 },
      { subject: 'Content Quality', A: audit.scores.contentQuality, fullMark: 100 },
      { subject: 'Technical SEO', A: audit.scores.technicalSeo, fullMark: 100 },
      { subject: 'Structured Data', A: audit.scores.structuredData, fullMark: 100 },
      { subject: 'Platform Opt', A: audit.scores.platformOptimization, fullMark: 100 },
    ];
  }, [audit]);

  const domain = useMemo(() => {
    if (!audit?.url) return null;
    try { return new URL(audit.url).hostname.replace(/^www\./, ""); } catch { return null; }
  }, [audit?.url]);

  const { data: historyData } = useQuery({
    queryKey: ["audit-history", domain],
    queryFn: () => customFetch<{ history: Array<{ id: number; url: string; geoScore: number; createdAt: string }> }>(`/api/geo/audits/history?domain=${encodeURIComponent(domain!)}`),
    enabled: !!domain && !!audit,
    staleTime: 60_000,
    retry: false,
  });

  const trendData = useMemo(() => {
    if (!historyData?.history) return [];
    return historyData.history.map((h) => ({
      date: new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: h.geoScore,
      id: h.id,
    }));
  }, [historyData]);

  const { data: fixesData, isLoading: fixesLoading, isError: fixesError } = useQuery({
    queryKey: ["audit-fixes", id],
    queryFn: () => customFetch<any>(`/api/geo/audits/${id}/fixes`),
    enabled: isPro && showFixes && !!id,
    staleTime: Infinity,
    retry: false,
  });

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch { /* ignore */ }
  };

  if (isLoading) {
    return (
      <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-mono">Analyzing GEO signals...</p>
      </div>
    );
  }

  if (isError || !audit) {
    return (
      <div className="flex-1 w-full flex items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl font-bold text-destructive">Audit Not Found</h2>
          <p className="text-muted-foreground">The requested audit could not be loaded or the analysis failed. Please try again.</p>
          <Link href="/" className="text-primary hover:underline inline-flex items-center gap-2 mt-4 font-mono">
            <ArrowLeft className="h-4 w-4" /> Back to Audits
          </Link>
        </div>
      </div>
    );
  }

  let overallColorClass = "text-red-500 border-red-500/20 bg-red-500/5";
  if (audit.geoScore >= 70) overallColorClass = "text-green-500 border-green-500/20 bg-green-500/5";
  else if (audit.geoScore >= 40) overallColorClass = "text-yellow-500 border-yellow-500/20 bg-yellow-500/5";

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b pb-6">
        <div className="space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors mb-2 uppercase tracking-wider">
            <ArrowLeft className="h-3 w-3" /> Back to Audits
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight break-all leading-tight">{audit.title || displayUrl(audit.url)}</h1>
          <p className="text-sm font-mono text-muted-foreground">{displayUrl(audit.url)}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 font-mono flex-wrap">
            <span>Analyzed on {new Date(audit.createdAt).toLocaleDateString()} at {new Date(audit.createdAt).toLocaleTimeString()}</span>
            <span>•</span>
            <span title={audit.requiresJavaScript ? "Rendered word count (after JavaScript executes)" : "Total words on page"}>
              {audit.wordCount.toLocaleString()} words
              {audit.requiresJavaScript && audit.rawHtmlWordCount != null && (
                <span className="text-amber-600 dark:text-amber-500"> · {audit.rawHtmlWordCount.toLocaleString()} to AI bots</span>
              )}
            </span>
            {audit.brandName && (<><span>•</span><span>Brand: <span className="text-foreground">{audit.brandName}</span></span></>)}
          </div>
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <a href={`/api/geo/audits/${audit.id}/pdf`} target="_blank" rel="noopener noreferrer" data-testid="link-download-pdf">
              <Button variant="outline" size="sm" className="font-mono text-xs gap-2" data-testid="button-download-pdf">
                <Download className="h-3.5 w-3.5" /> Download PDF Report
              </Button>
            </a>
            <Link href={`/simulate/${audit.id}`}>
              <Button size="sm" className="font-mono text-xs gap-2" data-testid="button-run-simulation">
                <Sparkles className="h-3.5 w-3.5" /> Run Prompt Simulation
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs gap-2"
              onClick={() => setShowFixes(v => !v)}
              data-testid="button-fix-generator"
            >
              {isPro ? <Wrench className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              Fix Generator {isPro ? (showFixes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <Badge className="text-[10px] ml-1 px-1 py-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">Pro</Badge>}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs gap-2"
              disabled={reRun.isPending}
              onClick={() => {
                reRun.mutate(
                  { data: { url: audit.url } },
                  {
                    onSuccess: (result) => setLocation(`/results/${result.id}`),
                    onError: (err: any) => toast({
                      title: "Re-scan failed",
                      description: err?.error || "Could not re-analyze this URL.",
                      variant: "destructive",
                    }),
                  }
                );
              }}
              data-testid="button-rerun"
            >
              {reRun.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {reRun.isPending ? "Re-scanning…" : "Re-scan URL"}
            </Button>
          </div>
        </div>
        
        {/* Big Score Ring */}
        <div className="shrink-0 self-center md:self-auto flex flex-col items-center justify-center p-6 rounded-full border-4 aspect-square min-w-[160px] shadow-sm relative overflow-hidden group hover:scale-105 transition-transform cursor-default" style={{ borderColor: 'currentColor' }}>
          <div className={`absolute inset-0 ${overallColorClass} opacity-50 group-hover:opacity-100 transition-opacity`} />
          <div className="relative z-10 text-center">
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">AEO Score</div>
            <div className={`text-6xl font-black font-mono tracking-tighter ${overallColorClass.split(' ')[0]}`} data-testid="text-geo-score">
              {audit.geoScore}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Summary */}
      {audit.aiInsights && (
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-primary font-mono text-base uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> AI Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h2 className="text-base font-semibold text-foreground mt-0 mb-3">{children}</h2>
                ),
                h2: ({ children }) => (
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wide mt-5 mb-2 first:mt-0">
                    {children}
                  </h3>
                ),
                h3: ({ children }) => (
                  <h4 className="text-sm font-semibold text-foreground mt-4 mb-1.5">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="text-sm leading-relaxed text-foreground/90 mb-3 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="text-sm leading-relaxed text-foreground/90 mb-3 ml-5 list-disc space-y-1.5 marker:text-primary/60">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="text-sm leading-relaxed text-foreground/90 mb-3 ml-5 list-decimal space-y-1.5 marker:text-primary/60">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="pl-1">{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
                code: ({ children }) => (
                  <code className="px-1 py-0.5 rounded bg-primary/10 text-primary font-mono text-[0.85em]">
                    {children}
                  </code>
                ),
                hr: () => <hr className="my-4 border-primary/20" />,
              }}
            >
              {audit.aiInsights}
            </ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart */}
        <Card className="bg-card border-border shadow-sm flex flex-col col-span-1">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[320px] p-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
                <PolarGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "var(--font-mono)" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="A" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary))" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 6 Score Breakdown Cards */}
        <TooltipProvider delayDuration={150}>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(() => {
              const blocks = audit.citabilityBlocks ?? [];
              const abBlocks = blocks.filter(b => b.grade === "A" || b.grade === "B").length;
              const avgCit = audit.avgCitabilityScore ?? (blocks.length ? Math.round(blocks.reduce((s, b) => s + b.score, 0) / blocks.length) : 0);
              const wc = audit.wordCount ?? 0;
              const wcContrib = Math.min(40, wc > 1000 ? 40 : Math.round(wc / 25));
              const titleContrib = audit.title ? 10 : 0;
              const descContrib = audit.description ? 15 : 0;
              const blockContrib = abBlocks * 3;
              const foundSignals = (audit.brandSignals ?? []).filter(s => s.found).length;
              const totalSignals = (audit.brandSignals ?? []).length;
              const presentSchemas = (audit.schemaTypes ?? []).filter(s => s.present).length;
              const totalSchemas = (audit.schemaTypes ?? []).length;
              const allowedCrawlers = (audit.crawlers ?? []).filter(c => c.allowed).length;
              const totalCrawlers = (audit.crawlers ?? []).length;
              const platformAvg = audit.platforms?.length
                ? Math.round(audit.platforms.reduce((s, p) => s + p.score, 0) / audit.platforms.length)
                : 0;
              return (
                <>
                  <ScoreCard
                    title="Citability"
                    score={audit.scores.citability}
                    weight="25%"
                    desc="Heading structure & density"
                    icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                    signals={[
                      { label: "Avg block score", value: `${avgCit}/100` },
                      { label: "Blocks analyzed", value: `${blocks.length}` },
                      { label: "Grade A/B blocks", value: `${abBlocks}` },
                    ]}
                    formula="round(avg block score × 1.2), capped at 100"
                  />
                  <ScoreCard
                    title="Brand Authority"
                    score={audit.scores.brandAuthority}
                    weight="20%"
                    desc="Mentions & entity clarity"
                    icon={<ShieldAlert className="h-4 w-4 text-muted-foreground" />}
                    signals={[
                      { label: "Confirmed signals", value: `${foundSignals} of ${totalSignals}` },
                      { label: "Brand", value: audit.brandName || "—" },
                    ]}
                    formula="baseline 10 + Wikipedia(35) + DuckDuckGo(20) + GitHub(6–20) + Org schema(10) + llms.txt(5). See Brand Authority Signals below."
                  />
                  <ScoreCard
                    title="Content Quality"
                    score={audit.scores.contentQuality}
                    weight="20%"
                    desc="Readability & depth"
                    icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                    signals={[
                      { label: `Word count (${wc.toLocaleString()})`, value: `+${wcContrib}` },
                      { label: `Title tag${audit.title ? "" : " (missing)"}`, value: `+${titleContrib}` },
                      { label: `Meta description${audit.description ? "" : " (missing)"}`, value: `+${descContrib}` },
                      { label: `A/B citability blocks (${abBlocks} × 3)`, value: `+${blockContrib}` },
                    ]}
                    formula="Sum of contributions, capped at 100. Differs from Citability because it weights word count and on-page metadata as well as block quality."
                  />
                  <ScoreCard
                    title="Technical SEO"
                    score={audit.scores.technicalSeo}
                    weight="15%"
                    desc="Performance & access"
                    icon={<Code2 className="h-4 w-4 text-muted-foreground" />}
                    signals={[
                      { label: "HTTPS", value: audit.hasHttps ? "+10" : "0" },
                      { label: "Canonical tag", value: audit.hasCanonical ? "+10" : "0" },
                      { label: "llms.txt", value: audit.hasLlmsTxt ? "+10" : "0" },
                      { label: "Long-form (>3k words)", value: wc > 3000 ? "+10" : "0" },
                    ]}
                    formula="baseline 60 + bonuses listed; minus penalties for SPA-only render or low word count."
                  />
                  <ScoreCard
                    title="Structured Data"
                    score={audit.scores.structuredData}
                    weight="10%"
                    desc="Schema.org markup"
                    icon={<Code2 className="h-4 w-4 text-muted-foreground" />}
                    signals={[
                      { label: "Schemas detected", value: `${presentSchemas} of ${totalSchemas}` },
                    ]}
                    formula={`round(${presentSchemas} / ${totalSchemas} × 100)`}
                  />
                  <ScoreCard
                    title="Platform Opt"
                    score={audit.scores.platformOptimization}
                    weight="10%"
                    desc="LLMs.txt & targeted"
                    icon={<Bot className="h-4 w-4 text-muted-foreground" />}
                    signals={[
                      { label: "AI crawlers allowed", value: `${allowedCrawlers} of ${totalCrawlers}` },
                      { label: "Platform score avg", value: `${platformAvg}/100` },
                    ]}
                    formula="Average of the four platform scores (ChatGPT, Claude, Perplexity, Google AI Overviews)."
                  />
                </>
              );
            })()}
          </div>
        </TooltipProvider>
      </div>

      {/* Prioritized GEO Recommendations */}
      {audit.recommendations && audit.recommendations.length > 0 && (
        <Card className="shadow-sm border-border mb-6">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Prioritized GEO Recommendations
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Grounded in Princeton/IIT Delhi GEO research (KDD 2024). Apply top items first.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="space-y-4">
              {audit.recommendations.slice(0, 12).map((r, i) => {
                const pStyle =
                  r.priority === "critical" ? "bg-red-100 text-red-700 border-red-200"
                  : r.priority === "high" ? "bg-amber-100 text-amber-700 border-amber-200"
                  : r.priority === "medium" ? "bg-teal-100 text-teal-700 border-teal-200"
                  : "bg-slate-100 text-slate-600 border-slate-200";
                return (
                  <li key={r.id ?? i} className="flex items-start gap-3 text-sm">
                    <span className={`shrink-0 inline-flex items-center justify-center px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase ${pStyle}`}>
                      {r.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground">{r.title}</div>
                      <div className="text-[11px] text-muted-foreground italic mt-0.5">
                        {r.category} · {r.impact}
                      </div>
                      <p className="text-sm text-muted-foreground leading-snug mt-1">{r.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Wins */}
        <Card className="flex flex-col shadow-sm border-border">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Actionable Quick Wins
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-6">
            {audit.quickWins.length > 0 ? (
              <ul className="space-y-4">
                {audit.quickWins.map((win, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex items-center justify-center shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-bold mt-0.5">{i+1}</span>
                    <span className="leading-snug">{win}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground h-full">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm">No quick wins identified. You're fully optimized!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technical Issues */}
        <Card className="flex flex-col shadow-sm border-border">
          <CardHeader className="bg-muted/30 pb-4 border-b">
            <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Technical Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pt-6">
            {audit.technicalIssues.length > 0 ? (
              <ul className="space-y-4">
                {audit.technicalIssues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <span className="leading-snug">{issue}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground h-full">
                <CheckCircle2 className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm">No technical issues found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Crawlers & Platforms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
              <TerminalSquare className="h-4 w-4" /> AI Crawler Access
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y border-t border-b">
              {audit.crawlers.map((crawler, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="font-bold text-sm">{crawler.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{crawler.type}</div>
                  </div>
                  <Badge variant="outline" className={`font-mono ${crawler.allowed ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20 dark:text-green-400' : 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20 dark:text-red-400'}`}>
                    {crawler.allowed ? "ALLOWED" : "BLOCKED"}
                  </Badge>
                </div>
              ))}
            </div>
            
            {/* Tech Checklist */}
            <div className="p-4 grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className={`p-2 rounded border ${audit.hasHttps ? 'bg-green-500/5 border-green-500/20 text-green-600' : 'bg-red-500/5 border-red-500/20 text-red-600'}`}>
                HTTPS: {audit.hasHttps ? 'YES' : 'NO'}
              </div>
              <div className={`p-2 rounded border ${audit.hasCanonical ? 'bg-green-500/5 border-green-500/20 text-green-600' : 'bg-red-500/5 border-red-500/20 text-red-600'}`}>
                Canonical: {audit.hasCanonical ? 'YES' : 'NO'}
              </div>
              <div className={`p-2 rounded border ${audit.hasLlmsTxt ? 'bg-green-500/5 border-green-500/20 text-green-600' : 'bg-yellow-500/5 border-yellow-500/20 text-yellow-600'}`}>
                llms.txt: {audit.hasLlmsTxt ? 'YES' : 'NO'}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                <Bot className="h-4 w-4" /> Platform Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y border-t">
                {audit.platforms.map((platform, i) => (
                  <div key={i} className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{platform.platform}</span>
                      <ScoreBadge score={platform.score} className="px-2 py-0.5 text-xs" />
                    </div>
                    <div className="text-xs text-muted-foreground">{platform.status}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
                <Code2 className="h-4 w-4" /> Schema Markup
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              {audit.schemaTypes.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">No schema markup detected.</div>
              ) : (
                <>
                  {audit.schemaTypes.some(s => s.present) && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">Detected</p>
                      <div className="flex flex-wrap gap-2">
                        {audit.schemaTypes.filter(s => s.present).map((schema, i) => (
                          <Badge key={i} className="font-mono text-[10px] uppercase bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {schema.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {audit.schemaTypes.some(s => !s.present) && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Missing</p>
                      <div className="flex flex-wrap gap-2">
                        {audit.schemaTypes.filter(s => !s.present).map((schema, i) => (
                          <Badge key={i} variant="outline" className="font-mono text-[10px] uppercase text-muted-foreground gap-1">
                            <XCircle className="h-3 w-3" /> {schema.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Brand Authority Signals */}
      {audit.brandSignals && audit.brandSignals.length > 0 && (
        <Card className="shadow-sm border-border" data-testid="card-brand-authority">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Brand Authority Signals
              {audit.brandName && <span className="text-muted-foreground">— {audit.brandName}</span>}
            </CardTitle>
            <CardDescription className="text-xs">Real-time checks against Wikipedia, DuckDuckGo, GitHub, and on-page entity markers.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y border-t">
              {audit.brandSignals.map((signal, i) => (
                <div key={i} className="flex items-start justify-between p-4 hover:bg-muted/30 transition-colors gap-4" data-testid={`row-brand-signal-${i}`}>
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {signal.found ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-sm">{signal.source}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5 break-words">
                        {signal.detail || (signal.found ? "Detected" : "Not found")}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`font-mono text-[10px] shrink-0 ${signal.found ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400' : 'text-muted-foreground border-muted-foreground/20'}`}>
                    {signal.found ? "FOUND" : "NONE"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fix Generator Panel */}
      {showFixes && (
        isPro ? (
          <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm">
            <CardHeader className="border-b bg-emerald-500/5 pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <Wrench className="h-4 w-4" /> Fix Generator
              </CardTitle>
              <CardDescription className="text-xs">Ready-to-deploy files generated from your audit. Copy each one into your site.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-6">
              {fixesLoading && <div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Generating custom fix files…</div>}
              {fixesError && <p className="text-sm text-destructive">Failed to generate fixes. Try again.</p>}
              {fixesData && (
                <>
                  {/* llms.txt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm font-mono">llms.txt</div>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => copyToClipboard(fixesData.llmsTxt, "llms")}>
                        {copiedKey === "llms" ? <><Check className="h-3 w-3 text-green-600" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                      </Button>
                    </div>
                    <pre className="text-xs font-mono bg-muted/60 rounded-lg p-4 overflow-auto max-h-64 whitespace-pre-wrap">{fixesData.llmsTxt}</pre>
                  </div>

                  {/* robots.txt snippet */}
                  {fixesData.crawlersBlocked?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm font-mono">robots.txt additions</div>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => copyToClipboard(fixesData.robotsSnippet, "robots")}>
                          {copiedKey === "robots" ? <><Check className="h-3 w-3 text-green-600" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                        </Button>
                      </div>
                      <pre className="text-xs font-mono bg-muted/60 rounded-lg p-4 overflow-auto max-h-48 whitespace-pre-wrap">{fixesData.robotsSnippet}</pre>
                    </div>
                  )}

                  {/* JSON-LD schema */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm font-mono">JSON-LD Schema Markup</div>
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={() => copyToClipboard(JSON.stringify(fixesData.schemaBlocks, null, 2), "schema")}>
                        {copiedKey === "schema" ? <><Check className="h-3 w-3 text-green-600" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                      </Button>
                    </div>
                    <pre className="text-xs font-mono bg-muted/60 rounded-lg p-4 overflow-auto max-h-80 whitespace-pre-wrap">{JSON.stringify(fixesData.schemaBlocks, null, 2)}</pre>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <UpgradePrompt
            feature="Fix Generator"
            description="Generate ready-to-deploy llms.txt, JSON-LD schema, and robots.txt additions tailored to your audit findings. Copy and paste into your site in minutes."
            requiredPlan="pro"
          />
        )
      )}

      {/* Visibility Trend */}
      {trendData.length > 1 && (
        <Card className="shadow-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-mono uppercase tracking-wider">
              <TrendingUp className="h-4 w-4 text-primary" /> AEO Score Trend
              <span className="text-muted-foreground font-normal normal-case tracking-normal ml-1">— {domain}</span>
            </CardTitle>
            <CardDescription className="text-xs">{trendData.length} audits tracked · Score history for this domain</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(v: any) => [v, "AEO Score"]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Citability Blocks Preview */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono uppercase tracking-wider flex items-center gap-2 font-bold px-2">
          <FileText className="h-4 w-4" /> Citability Blocks (Avg: {audit.avgCitabilityScore})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {audit.citabilityBlocks.length > 0 ? (
            audit.citabilityBlocks.map((block, i) => (
              <Card key={i} className="shadow-sm border-border overflow-hidden flex flex-col">
                <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                  <div className="font-bold text-sm truncate pr-4">{block.heading || "No Heading"}</div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-muted-foreground">{block.wordCount}w</span>
                    <Badge variant="outline" className={`font-mono text-xs ${
                      block.grade === 'A' ? 'text-green-500 border-green-500/30 bg-green-500/10' :
                      block.grade === 'B' ? 'text-green-400 border-green-400/30 bg-green-400/10' :
                      block.grade === 'C' ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' :
                      block.grade === 'D' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' :
                      'text-red-500 border-red-500/30 bg-red-500/10'
                    }`}>
                      Grade {block.grade}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4 text-xs text-muted-foreground flex-1 font-mono leading-relaxed bg-muted/5">
                  "{block.preview}"
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-8 text-center border border-dashed rounded-lg text-muted-foreground text-sm">
              No distinct citability blocks identified. Add clear headings and concise paragraphs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ScoreSignal { label: string; value: string; }

function ScoreCard({
  title, score, weight, desc, icon, formula, signals,
}: {
  title: string;
  score: number;
  weight: string;
  desc: string;
  icon: React.ReactNode;
  formula?: string;
  signals?: ScoreSignal[];
}) {
  const card = (
    <Card className="bg-card border-border shadow-sm flex flex-col hover:border-primary/30 transition-colors group h-full">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-xs font-bold uppercase tracking-wider">{title}</CardTitle>
            {(formula || (signals && signals.length > 0)) && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-mono uppercase tracking-wider text-primary/70 group-hover:text-primary transition-colors border border-primary/20 rounded px-1 py-0.5">
                <Info className="h-2.5 w-2.5" />
                <span>How?</span>
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded border bg-muted/30">w:{weight}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-end">
        <div className="flex items-end justify-between mt-2 mb-3">
          <div className="text-3xl font-black font-mono tracking-tighter">
            {score}<span className="text-base text-muted-foreground/60">/100</span>
          </div>
          <ScoreBadge score={score} />
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1" title={desc}>{desc}</p>
      </CardContent>
    </Card>
  );

  if (!formula && (!signals || signals.length === 0)) return card;

  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <div className="cursor-help h-full" data-testid={`tooltip-trigger-${title.toLowerCase().replace(/\s+/g, '-')}`}>{card}</div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-xs bg-popover text-popover-foreground border shadow-lg p-3 space-y-2"
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title} — How it's scored</div>
        {signals && signals.length > 0 && (
          <ul className="text-xs space-y-1">
            {signals.map((s, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3">
                <span className="text-foreground/80">{s.label}</span>
                <span className="font-mono text-foreground tabular-nums">{s.value}</span>
              </li>
            ))}
          </ul>
        )}
        {formula && (
          <div className="text-[11px] font-mono text-muted-foreground border-t border-border/50 pt-2 leading-relaxed">
            {formula}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
