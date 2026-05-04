import React, { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import {
  useGetAudit,
  useSuggestPrompts,
  useRunSimulation,
  useGetLatestSimulationForAudit,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Sparkles, Play, ArrowLeft, CheckCircle2, XCircle, Link as LinkIcon, AlertTriangle, ExternalLink, Lock, TrendingUp, TrendingDown, Minus, Plus, Trash2, Trophy, BarChart3, Info } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { Separator } from "@/components/ui/separator";

const ENGINES = [
  { id: "chatgpt", label: "ChatGPT", color: "bg-emerald-500" },
  { id: "claude", label: "Claude", color: "bg-orange-500" },
  { id: "gemini", label: "Gemini", color: "bg-blue-500" },
  { id: "perplexity", label: "Perplexity", color: "bg-purple-500" },
] as const;

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function getDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  if (!sentiment) return null;
  if (sentiment === "Positive") return (
    <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 gap-1">
      <TrendingUp className="h-3 w-3" /> Positive
    </Badge>
  );
  if (sentiment === "Negative") return (
    <Badge className="text-xs bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 gap-1">
      <TrendingDown className="h-3 w-3" /> Negative
    </Badge>
  );
  return (
    <Badge variant="outline" className="text-xs gap-1">
      <Minus className="h-3 w-3" /> Neutral
    </Badge>
  );
}

export default function SimulatePage() {
  const params = useParams<{ id: string }>();
  const auditId = parseInt(params.id, 10);
  const { data: audit, isLoading: auditLoading } = useGetAudit(auditId);
  const { plan, isPro, simulationPrompts: maxPrompts, simulationEngines: allowedEngines, isLoading: planLoading } = usePlan();

  const [brandName, setBrandName] = useState("");
  const [promptsText, setPromptsText] = useState("");
  const [selectedEngines, setSelectedEngines] = useState<string[]>(ENGINES.map(e => e.id));
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(["", "", ""]);

  const suggest = useSuggestPrompts();
  const run = useRunSimulation();
  const latest = useGetLatestSimulationForAudit(auditId, {
    query: { retry: false, refetchOnWindowFocus: false, queryKey: ["simulation", "latest", auditId] },
  });

  const domain = useMemo(() => audit?.url ? getDomain(audit.url) : "", [audit]);

  // Hydrate brand name from audit
  React.useEffect(() => {
    if (audit && !brandName) {
      setBrandName(audit.brandName || domain.split(".")[0] || "");
    }
  }, [audit, domain]);

  const prompts = useMemo(
    () => promptsText.split("\n").map(s => s.trim()).filter(s => s.length >= 5),
    [promptsText]
  );
  const promptLines = useMemo(
    () => promptsText.split("\n").map(s => s.trim()).filter(Boolean),
    [promptsText]
  );
  const invalidPromptCount = Math.max(0, promptLines.length - prompts.length);
  const runDisabledReason = !brandName.trim()
    ? "Add a brand name."
    : !domain
    ? "Audit domain missing."
    : prompts.length === 0
    ? "Add at least one prompt with 5+ characters."
    : selectedEngines.length === 0
    ? "Select at least one engine."
    : null;

  const handleSuggest = async () => {
    if (!brandName) return;
    const res = await suggest.mutateAsync({
      data: {
        brandName,
        description: audit?.description || undefined,
        ...(audit?.title ? { title: audit.title } : {}),
        ...(audit?.aiInsights ? { aiInsights: audit.aiInsights } : {}),
      } as any,
    });
    setPromptsText((res as any).prompts.join("\n"));
  };

  const handleRun = async () => {
    if (!brandName || prompts.length === 0 || !domain) return;
    await run.mutateAsync({
      data: {
        auditId,
        domain,
        brandName,
        prompts,
        engines: selectedEngines as any,
      },
    });
  };

  const toggleEngine = (id: string) => {
    setSelectedEngines(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const setCompetitorUrl = (idx: number, val: string) => {
    setCompetitorUrls(prev => prev.map((u, i) => i === idx ? val : u));
  };

  const activeCompetitorDomains = useMemo(() => {
    return competitorUrls
      .map(u => u.trim())
      .filter(Boolean)
      .map(u => {
        try {
          const withScheme = u.startsWith("http") ? u : `https://${u}`;
          return new URL(withScheme).hostname.replace(/^www\./, "");
        } catch { return u.replace(/^www\./, "").split("/")[0]; }
      })
      .filter(Boolean);
  }, [competitorUrls]);

  // Show live mutation result if present, otherwise the most-recent saved one.
  // After a fresh run completes, refetch the "latest" cache so subsequent
  // mounts/refreshes show the same data.
  React.useEffect(() => {
    if (run.isSuccess) {
      latest.refetch();
    }
  }, [run.isSuccess]);
  const result = (run.data as any) || (latest.data as any);
  const showingHistorical = !run.data && !!latest.data;

  // Citation Gap: computed entirely from existing citedUrls in results — no extra API calls
  const citationGap = useMemo(() => {
    if (!result?.results || activeCompetitorDomains.length === 0) return null;

    const allRows: any[] = result.results;
    const allEngineIds: string[] = ENGINES.map(e => e.id);
    const trackDomains = [domain, ...activeCompetitorDomains].filter(Boolean);

    function domainMatchesUrl(targetDomain: string, url: string): boolean {
      try {
        const h = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
        const t = targetDomain.toLowerCase().replace(/^www\./, "");
        return h === t || h.endsWith(`.${t}`);
      } catch { return false; }
    }

    return trackDomains.map((d, idx) => {
      const isYou = idx === 0;
      const perEngine = allEngineIds.map(engineId => {
        const engineRows = allRows.flatMap((row: any) =>
          row.engines.filter((er: any) => er.engine === engineId && !er.error)
        );
        const total = engineRows.length;
        const cited = engineRows.filter((er: any) =>
          er.citedUrls?.some((u: string) => domainMatchesUrl(d, u))
        ).length;
        const mentioned = isYou
          ? engineRows.filter((er: any) => er.brandMentioned).length
          : engineRows.filter((er: any) =>
              er.competitorMentions?.some((c: string) => c.toLowerCase().includes(d.toLowerCase().split(".")[0]))
            ).length;
        return { engineId, citationRate: total > 0 ? cited / total : 0, mentionRate: total > 0 ? mentioned / total : 0, cited, total };
      });
      const overallCited = perEngine.reduce((s, e) => s + e.cited, 0);
      const overallTotal = perEngine.reduce((s, e) => s + e.total, 0);
      return { domain: d, isYou, perEngine, overallCitationRate: overallTotal > 0 ? overallCited / overallTotal : 0 };
    });
  }, [result, activeCompetitorDomains, domain]);

  if (auditLoading) {
    return <div className="container max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="container max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <Link href={`/results/${auditId}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to audit
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Prompt Simulation</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          See how AI search engines respond when users search for your category
          {audit && <> · <span className="font-medium text-foreground">{domain}</span></>}
        </p>
      </div>

      {/* Configuration card */}
      <Card>
        <CardHeader>
          <CardTitle>Configure simulation</CardTitle>
          <CardDescription>
            Enter prompts a typical user would search for in your category. We'll query each AI engine and report whether your brand is mentioned and your domain is cited.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Brand name</label>
              <Input
                placeholder="e.g. Acme"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Domain</label>
              <Input
                value={domain}
                placeholder={audit?.url ? getDomain(audit.url) : "loading…"}
                readOnly
                className="bg-muted/40 text-foreground"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">
                Prompts (one per line
                {!isPro && <span className="ml-1 text-amber-600 font-semibold">· Free: max {maxPrompts}</span>})
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSuggest}
                disabled={!brandName || suggest.isPending}
              >
                {suggest.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                Auto-generate
              </Button>
            </div>
            <Textarea
              rows={8}
              placeholder={"best CRM for small teams\nhow do I improve email deliverability\nstripe vs square comparison"}
              value={promptsText}
              onChange={(e) => setPromptsText(e.target.value)}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">{prompts.length} valid prompt{prompts.length === 1 ? "" : "s"}</p>
              {invalidPromptCount > 0 && (
                <p className="text-xs text-amber-600 font-medium">
                  {invalidPromptCount} line{invalidPromptCount === 1 ? "" : "s"} ignored (&lt;5 chars)
                </p>
              )}
              {!isPro && prompts.length > maxPrompts && (
                <p className="text-xs text-amber-600 font-medium">Only first {maxPrompts} prompts will run on the Free plan</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Engines</label>
            <div className="flex flex-wrap gap-2">
              {ENGINES.map(e => {
                const locked = !isPro && !allowedEngines.includes(e.id);
                return (
                  <button
                    key={e.id}
                    onClick={() => !locked && toggleEngine(e.id)}
                    disabled={locked}
                    title={locked ? `Upgrade to Pro to use ${e.label}` : undefined}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ${
                      locked
                        ? "border-border bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
                        : selectedEngines.includes(e.id)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${e.color}`} />
                    {e.label}
                    {locked && <Lock className="h-3 w-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
            {!isPro && (
              <p className="text-xs text-muted-foreground mt-2">Free plan: ChatGPT only · <span className="text-primary cursor-pointer hover:underline">Upgrade to Pro</span> for all 4 engines</p>
            )}
          </div>

          <Separator />

          {/* Competitor Tracking */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Competitor Tracking</label>
              <Badge className="text-[10px] px-1.5 py-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold">Pro</Badge>
            </div>
            {isPro ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-3">Enter up to 3 competitor URLs. After running, we'll show a Citation Gap — how often AI engines cite them vs. you.</p>
                {competitorUrls.map((url, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input
                      placeholder={`Competitor ${idx + 1} URL (e.g. competitor.com)`}
                      value={url}
                      onChange={e => setCompetitorUrl(idx, e.target.value)}
                      className="flex-1 text-sm"
                    />
                    {url && (
                      <button onClick={() => setCompetitorUrl(idx, "")} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <UpgradePrompt
                feature="Competitor Tracking"
                description="Track up to 3 competitor domains and see exactly how often AI engines cite them versus your site — per prompt, per engine."
                requiredPlan="pro"
                compact
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={handleRun}
              disabled={run.isPending || !!runDisabledReason}
              size="lg"
              className="w-full sm:w-auto"
            >
              {run.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running ({prompts.length * selectedEngines.length} queries)…</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Run simulation</>
              )}
            </Button>
            {run.isPending && (
              <p className="text-sm text-muted-foreground">
                This may take 1–3 minutes. Each engine performs a live web search.
              </p>
            )}
            {!run.isPending && runDisabledReason && (
              <p className="text-sm text-amber-700 dark:text-amber-500">{runDisabledReason}</p>
            )}
            {run.isError && (
              <p className="text-sm text-destructive">
                {(run.error as any)?.message || "Simulation failed"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <>
          {showingHistorical && (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-3 text-sm">
              Showing your most recent simulation
              {result.createdAt ? <> from {new Date(result.createdAt).toLocaleString()}</> : null}.
              Run a new one above to refresh the data.
            </div>
          )}
          {/* Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>AI Visibility Score</CardTitle>
                  <CardDescription>Across {result.summary.totalPrompts} prompts and {result.summary.perEngine.length} engines</CardDescription>
                </div>
                <div className="text-right">
                  <div className={`text-5xl font-bold ${
                    result.summary.overallVisibilityScore >= 60 ? "text-green-600"
                    : result.summary.overallVisibilityScore >= 30 ? "text-yellow-600"
                    : "text-red-600"
                  }`}>{result.summary.overallVisibilityScore}</div>
                  <div className="text-xs text-muted-foreground">/ 100</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {result.summary.perEngine.map((e: any) => {
                  const eng = ENGINES.find(x => x.id === e.engine);
                  return (
                    <div key={e.engine} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${eng?.color || "bg-gray-400"}`} />
                        <span className="font-semibold">{e.engineLabel}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Mentioned</span>
                        <span className="font-mono font-semibold">{pct(e.mentionRate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cited</span>
                        <span className="font-mono font-semibold">{pct(e.citationRate)}</span>
                      </div>
                      {e.avgFirstPosition !== null && e.avgFirstPosition !== undefined && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-1">
                            Avg depth
                            <Info
                              className="h-3 w-3 text-muted-foreground/50 shrink-0"
                              title="How far into the response your brand first appears, averaged across prompts. 0% = very top, 100% = end of response. Lower is better."
                            />
                          </span>
                          <span className="font-mono">{pct(e.avgFirstPosition)}</span>
                        </div>
                      )}
                      {e.errorRate > 0 && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                          <AlertTriangle className="h-3 w-3" /> {pct(e.errorRate)} errored
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {result.summary.topCompetitors.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="text-sm font-medium mb-2">Most-mentioned brands across responses</div>
                  <div className="flex flex-wrap gap-2">
                    {result.summary.topCompetitors.map((c: any) => (
                      <Badge key={c.name} variant="secondary">
                        {c.name} <span className="ml-1.5 opacity-60">×{c.count}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Citation Gap */}
          {citationGap && citationGap.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" /> Citation Gap Analysis
                </CardTitle>
                <CardDescription>How often each AI engine cited your domain vs. competitors across all prompts</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Sort so highest overall citation rate is first (after your domain) */}
                {(() => {
                  const [you, ...comps] = citationGap;
                  const sorted = [you, ...comps.sort((a, b) => b.overallCitationRate - a.overallCitationRate)];
                  const activeEngineIds = result.summary.perEngine.map((e: any) => e.engine);
                  const activeEngines = ENGINES.filter(e => activeEngineIds.includes(e.id));
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="text-left py-2 pr-4 font-medium min-w-[140px]">Domain</th>
                            {activeEngines.map(e => (
                              <th key={e.id} className="text-center py-2 px-3 font-medium">
                                <span className="flex items-center justify-center gap-1.5">
                                  <span className={`h-2 w-2 rounded-full ${e.color}`} />
                                  {e.label}
                                </span>
                              </th>
                            ))}
                            <th className="text-center py-2 px-3 font-medium">Overall</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sorted.map((row, i) => {
                            const gap = row.overallCitationRate - you.overallCitationRate;
                            const noData = !row.isYou && row.overallCitationRate === 0 && you.overallCitationRate === 0;
                            return (
                              <tr key={row.domain} className={`border-b last:border-0 ${row.isYou ? "bg-primary/5" : ""}`}>
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2">
                                    {row.isYou && <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />}
                                    <div>
                                      <div className={`font-semibold truncate max-w-[160px] ${row.isYou ? "text-primary" : ""}`}>
                                        {row.isYou ? `${row.domain} (you)` : row.domain}
                                      </div>
                                      {!row.isYou && !noData && (
                                        <div className={`text-[10px] font-mono font-semibold ${gap > 0 ? "text-red-500" : "text-green-500"}`}>
                                          {gap > 0 ? `↑ ${Math.round(gap * 100)}pp ahead` : `↓ ${Math.round(Math.abs(gap) * 100)}pp behind`}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                {activeEngines.map(eng => {
                                  const ep = row.perEngine.find((p: any) => p.engineId === eng.id);
                                  const rate = ep?.citationRate ?? 0;
                                  return (
                                    <td key={eng.id} className="text-center py-3 px-3">
                                      <div className={`font-mono font-bold text-base ${
                                        rate === 0 ? "text-muted-foreground/50"
                                        : rate >= 0.5 ? "text-green-600 dark:text-green-400"
                                        : rate >= 0.25 ? "text-yellow-600 dark:text-yellow-400"
                                        : "text-red-500"
                                      }`}>
                                        {Math.round(rate * 100)}%
                                      </div>
                                      <div className="text-[10px] text-muted-foreground">{ep?.cited ?? 0}/{ep?.total ?? 0}</div>
                                    </td>
                                  );
                                })}
                                <td className="text-center py-3 px-3">
                                  <div className={`font-mono font-bold text-lg ${
                                    row.overallCitationRate >= 0.5 ? "text-green-600 dark:text-green-400"
                                    : row.overallCitationRate >= 0.25 ? "text-yellow-600"
                                    : "text-red-500"
                                  }`}>
                                    {Math.round(row.overallCitationRate * 100)}%
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <p className="text-xs text-muted-foreground mt-4 italic">
                        Citation rate = % of prompts where the domain appeared in the engine's source links. Competitor mention detection uses domain name matching.
                      </p>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Per-prompt breakdown */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Per-prompt breakdown</h2>
            {result.results.map((row: any, i: number) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base font-medium">"{row.prompt}"</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {row.engines.map((er: any) => {
                      const eng = ENGINES.find(x => x.id === er.engine);
                      return (
                        <div key={er.engine} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${eng?.color}`} />
                              <span className="font-semibold text-sm">{er.engineLabel}</span>
                            </div>
                            <div className="flex gap-1 flex-wrap justify-end">
                              {er.error ? (
                                <Badge variant="destructive" className="text-xs">error</Badge>
                              ) : (
                                <>
                                  <Badge
                                    variant={er.brandMentioned ? "default" : "outline"}
                                    className="text-xs"
                                  >
                                    {er.brandMentioned ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                                    Mention
                                  </Badge>
                                  <Badge
                                    variant={er.domainCited ? "default" : "outline"}
                                    className="text-xs"
                                  >
                                    <LinkIcon className="h-3 w-3 mr-1" />
                                    Cited
                                  </Badge>
                                  {er.brandMentioned && <SentimentBadge sentiment={er.sentiment} />}
                                </>
                              )}
                            </div>
                          </div>
                          {er.error ? (
                            <p className="text-xs text-destructive">{er.error}</p>
                          ) : (
                            <>
                              <p className="text-xs text-muted-foreground line-clamp-4">{er.responseText.slice(0, 400)}{er.responseText.length > 400 ? "…" : ""}</p>
                              {er.citedUrls.length > 0 && (
                                <div className="text-xs space-y-0.5 pt-1 border-t">
                                  <div className="font-medium text-muted-foreground mb-1">{er.citedUrls.length} source{er.citedUrls.length === 1 ? "" : "s"}</div>
                                  {er.citedUrls.slice(0, 3).map((u: string, j: number) => (
                                    <a key={j} href={u} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline truncate">
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                      <span className="truncate">{u.replace(/^https?:\/\//, "")}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
