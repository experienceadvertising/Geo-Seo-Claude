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
import { Loader2, Sparkles, Play, ArrowLeft, CheckCircle2, XCircle, Link as LinkIcon, AlertTriangle, ExternalLink } from "lucide-react";

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

export default function SimulatePage() {
  const params = useParams<{ id: string }>();
  const auditId = parseInt(params.id, 10);
  const { data: audit, isLoading: auditLoading } = useGetAudit(auditId);

  const [brandName, setBrandName] = useState("");
  const [promptsText, setPromptsText] = useState("");
  const [selectedEngines, setSelectedEngines] = useState<string[]>(ENGINES.map(e => e.id));

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
              <Input value={domain} disabled />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium">Prompts (one per line, max 25)</label>
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
            <p className="text-xs text-muted-foreground mt-1">{prompts.length} valid prompt{prompts.length === 1 ? "" : "s"}</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Engines</label>
            <div className="flex flex-wrap gap-2">
              {ENGINES.map(e => (
                <button
                  key={e.id}
                  onClick={() => toggleEngine(e.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ${
                    selectedEngines.includes(e.id)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${e.color}`} />
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={handleRun}
              disabled={run.isPending || prompts.length === 0 || !brandName || selectedEngines.length === 0}
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
                          <span className="text-muted-foreground">Avg position</span>
                          <span className="font-mono">{pct(e.avgFirstPosition)} in</span>
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
                            <div className="flex gap-1">
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
