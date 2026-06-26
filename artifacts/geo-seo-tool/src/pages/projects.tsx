import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import {
  Loader2, Plus, Play, Pause, Trash2, ExternalLink, Bell, Sparkles, Clock, Bot, Copy, Check, LineChart as LineChartIcon, Link2,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBadge } from "@/components/score-badge";
import { useToast } from "@/hooks/use-toast";

type Frequency = "daily" | "weekly";

interface MonitoredSite {
  id: number;
  url: string;
  label: string | null;
  active: boolean;
  frequency: Frequency;
  lastAuditId: number | null;
  lastScore: number | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
}

interface ListResponse {
  sites: MonitoredSite[];
  limit: number;
  plan: string;
}

interface CrawlerActivity {
  token: string;
  pixelUrl: string;
  snippet: string;
  knownCrawlers: string[];
  total: number;
  byCrawler: Array<{ crawler: string; count: number; lastSeen: string }>;
  daily: Array<{ day: string; count: number }>;
  recent: Array<{ crawler: string; path: string | null; createdAt: string }>;
}

const QUERY_KEY = ["geo", "monitored-sites"];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getTime() === 0) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function displayUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname.replace(/\/$/, "") : "");
  } catch {
    return raw;
  }
}

interface GoogleStatus { configured: boolean; connected: boolean; propertyId: string | null; propertyName: string | null }
interface Ga4Property { property: string; displayName: string; account: string }
interface AiReferrals {
  property: string;
  days: number;
  totalSessions: number;
  series: Array<{ date: string; sessions: number }>;
  bySource: Array<{ source: string; sessions: number }>;
}

// Google Analytics integration — connect a GA4 property and see how much real
// traffic AI answer engines (ChatGPT, Perplexity, Gemini, …) actually sent you,
// closing the loop from "am I cited" to "did it drive visits". Self-contained
// (own queries) and rendered only for Pro users.
function GoogleAnalyticsSection() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const status = useQuery<GoogleStatus>({
    queryKey: ["google", "status"],
    queryFn: () => customFetch<GoogleStatus>("/api/integrations/google/status"),
    retry: false,
  });

  // Surface the OAuth round-trip result (?google=connected|denied|error|…) once.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const g = p.get("google");
    if (!g) return;
    if (g === "connected") toast({ title: "Google connected", description: "Pick the GA4 property you want to report on." });
    else if (g === "denied") toast({ title: "Connection cancelled", variant: "destructive" });
    else toast({ title: "Couldn't connect Google", description: "Please try again.", variant: "destructive" });
    p.delete("google");
    window.history.replaceState({}, "", window.location.pathname + (p.toString() ? `?${p}` : ""));
    qc.invalidateQueries({ queryKey: ["google"] });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const connected = !!status.data?.connected;
  const propertyId = status.data?.propertyId ?? null;

  const properties = useQuery<{ properties: Ga4Property[] }>({
    queryKey: ["google", "properties"],
    queryFn: () => customFetch<{ properties: Ga4Property[] }>("/api/integrations/google/properties"),
    enabled: connected && !propertyId,
    retry: false,
  });

  const referrals = useQuery<AiReferrals>({
    queryKey: ["google", "ai-referrals"],
    queryFn: () => customFetch<AiReferrals>("/api/integrations/google/ai-referrals"),
    enabled: connected && !!propertyId,
    retry: false,
  });

  const setProperty = useMutation({
    mutationFn: (p: Ga4Property) => customFetch("/api/integrations/google/property", { method: "POST", body: JSON.stringify({ propertyId: p.property, propertyName: p.displayName }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["google"] }),
  });

  const disconnect = useMutation({
    mutationFn: () => customFetch("/api/integrations/google/disconnect", { method: "POST" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["google"] }); toast({ title: "Google disconnected" }); },
  });

  if (status.isLoading) return <div className="h-32 rounded-xl bg-muted/50 animate-pulse" />;
  if (!status.data?.configured) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-sm text-muted-foreground">
          Google Analytics integration isn't configured on this server yet. Once it's set up you'll be able to connect a
          GA4 property here and see how much traffic AI engines are actually driving to your site.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><LineChartIcon className="h-4 w-4 text-emerald-600" /> AI referral traffic (Google Analytics)</CardTitle>
            <CardDescription>Real sessions AI answer engines sent to your site — the payoff for getting cited.</CardDescription>
          </div>
          {connected && (
            <Button size="sm" variant="ghost" onClick={() => disconnect.mutate()} disabled={disconnect.isPending} className="text-muted-foreground">
              Disconnect
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connected ? (
          <div className="flex items-center gap-3">
            <Button onClick={() => { window.location.href = "/api/integrations/google/connect"; }}>
              <Link2 className="h-4 w-4 mr-1.5" /> Connect Google Analytics
            </Button>
            <span className="text-xs text-muted-foreground">Read-only. We only read AI-referral session counts.</span>
          </div>
        ) : !propertyId ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Choose the GA4 property to report on:</p>
            {properties.isLoading ? (
              <div className="h-20 rounded-lg bg-muted/50 animate-pulse" />
            ) : properties.data?.properties?.length ? (
              <div className="flex flex-col gap-1.5 max-h-64 overflow-auto">
                {properties.data.properties.map((p) => (
                  <button
                    key={p.property}
                    onClick={() => setProperty.mutate(p)}
                    disabled={setProperty.isPending}
                    className="text-left rounded-md border px-3 py-2 text-sm hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors"
                  >
                    <span className="font-medium">{p.displayName}</span>
                    {p.account && <span className="text-xs text-muted-foreground ml-2">{p.account}</span>}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No GA4 properties found on this Google account.</p>
            )}
          </div>
        ) : referrals.isLoading ? (
          <div className="h-44 rounded-lg bg-muted/50 animate-pulse" />
        ) : referrals.data ? (
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{referrals.data.totalSessions.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">AI-referred sessions · last {referrals.data.days} days · {referrals.data.property}</span>
            </div>
            {referrals.data.totalSessions === 0 ? (
              <p className="text-sm text-muted-foreground">
                No AI-referral sessions recorded in this window yet. As ChatGPT, Perplexity and others start citing you,
                their referred visits will show up here.
              </p>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={referrals.data.series.map((s) => ({ name: s.date.slice(5), sessions: s.sessions }))} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="sessions" fill="#10b981" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2">
                  {referrals.data.bySource.slice(0, 8).map((s) => (
                    <Badge key={s.source} variant="secondary">{s.source} <span className="ml-1.5 opacity-60">{s.sessions.toLocaleString()}</span></Badge>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Couldn't load GA4 data. Try disconnecting and reconnecting Google.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProjectsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("weekly");

  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: QUERY_KEY,
    queryFn: () => customFetch<ListResponse>("/api/geo/monitored-sites"),
  });

  // AI crawler activity (Pro). Enabled once we know the plan supports it.
  const crawler = useQuery<CrawlerActivity>({
    queryKey: ["geo", "crawler-activity"],
    queryFn: () => customFetch<CrawlerActivity>("/api/geo/crawler-activity"),
    enabled: (data?.limit ?? 0) > 0,
    retry: false,
  });

  function copySnippet(snippet: string) {
    navigator.clipboard?.writeText(snippet).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2000); toast({ title: "Snippet copied" }); },
      () => toast({ title: "Couldn't copy", description: "Select and copy the snippet manually.", variant: "destructive" }),
    );
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const addSite = useMutation({
    mutationFn: (payload: { url: string; label?: string; frequency: Frequency }) =>
      customFetch<MonitoredSite>("/api/geo/monitored-sites", { method: "POST", body: JSON.stringify(payload) }),
    onSuccess: () => {
      setUrl(""); setLabel("");
      invalidate();
      toast({ title: "Site added", description: "We'll re-audit it on schedule and alert you when its score moves." });
    },
    onError: (err: any) => {
      toast({ title: "Couldn't add site", description: err?.body?.error || err?.message || "Please try again.", variant: "destructive" });
    },
  });

  const runNow = useMutation({
    mutationFn: (id: number) => customFetch(`/api/geo/monitored-sites/${id}/run`, { method: "POST" }),
    onSuccess: () => { invalidate(); toast({ title: "Re-audit complete", description: "The latest score is in." }); },
    onError: (err: any) => toast({ title: "Run failed", description: err?.body?.error || err?.message || "Please try again.", variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      customFetch(`/api/geo/monitored-sites/${id}`, { method: "PATCH", body: JSON.stringify({ active }) }),
    onSuccess: invalidate,
  });

  const setFreq = useMutation({
    mutationFn: ({ id, frequency }: { id: number; frequency: Frequency }) =>
      customFetch(`/api/geo/monitored-sites/${id}`, { method: "PATCH", body: JSON.stringify({ frequency }) }),
    onSuccess: invalidate,
  });

  const removeSite = useMutation({
    mutationFn: (id: number) => customFetch(`/api/geo/monitored-sites/${id}`, { method: "DELETE" }),
    onSuccess: () => { invalidate(); toast({ title: "Removed from monitoring" }); },
    onError: (err: any) => toast({ title: "Couldn't remove", description: err?.body?.error || err?.message || "Please try again.", variant: "destructive" }),
  });

  const sites = data?.sites ?? [];
  const limit = data?.limit ?? 0;
  const plan = data?.plan ?? "free";
  const atLimit = limit > 0 && sites.length >= limit;
  const monitoringLocked = limit === 0;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    addSite.mutate({ url: url.trim(), label: label.trim() || undefined, frequency });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <SEO title="Projects — Monitored sites | AEO Improvement" description="Track your sites' AEO scores continuously with scheduled re-audits and score-change alerts." path="/projects" index={false} />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6 text-emerald-600" /> Projects
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Add the sites you want to watch. We re-audit each one on schedule and email you when its AEO score moves by
          5 points or more — so you find out before your competitors do.
        </p>
      </div>

      {monitoringLocked ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="py-8 text-center space-y-4">
            <Sparkles className="h-8 w-8 text-emerald-600 mx-auto" />
            <div className="space-y-1">
              <p className="font-semibold">Continuous monitoring is a Pro feature</p>
              <p className="text-sm text-muted-foreground">
                Upgrade to track up to 10 sites with weekly auto-audits and score-change alerts. Agency tracks 50.
              </p>
            </div>
            <Link href="/pricing">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Upgrade to Pro</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Add a site to monitor</CardTitle>
            <CardDescription>
              {sites.length}/{limit} sites used on your {plan} plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                disabled={atLimit}
              />
              <Input
                placeholder="Label (optional)"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="sm:w-40"
                disabled={atLimit}
              />
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                disabled={atLimit}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
              <Button type="submit" disabled={atLimit || addSite.isPending}>
                {addSite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add</>}
              </Button>
            </form>
            {atLimit && (
              <p className="text-xs text-amber-600 mt-2">
                You've reached your plan's monitoring limit. Remove a site or{" "}
                <Link href="/pricing" className="underline">upgrade</Link> to add more.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Monitored sites</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />)}
          </div>
        ) : sites.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              No sites monitored yet. Add one above to start tracking its AEO score over time.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sites.map((site) => (
              <Card key={site.id} className={site.active ? "" : "opacity-60"}>
                <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{site.label || displayUrl(site.url)}</span>
                      {!site.active && <Badge variant="outline" className="text-[10px]">Paused</Badge>}
                    </div>
                    {site.label && <span className="text-xs text-muted-foreground truncate block">{displayUrl(site.url)}</span>}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {site.frequency}</span>
                      <span>Last run: {fmtDate(site.lastRunAt)}</span>
                      {site.active && <span>Next: {fmtDate(site.nextRunAt)}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {site.lastScore != null ? (
                      site.lastAuditId ? (
                        <Link href={`/results/${site.lastAuditId}`} title="Open latest audit">
                          <ScoreBadge score={Math.round(site.lastScore)} />
                        </Link>
                      ) : <ScoreBadge score={Math.round(site.lastScore)} />
                    ) : (
                      <span className="text-xs text-muted-foreground">No runs yet</span>
                    )}
                    <select
                      value={site.frequency}
                      onChange={(e) => setFreq.mutate({ id: site.id, frequency: e.target.value as Frequency })}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      title="Cadence"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                    </select>
                    <Button size="sm" variant="outline" onClick={() => runNow.mutate(site.id)} disabled={runNow.isPending} title="Re-audit now">
                      {runNow.isPending && runNow.variables === site.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive.mutate({ id: site.id, active: !site.active })} title={site.active ? "Pause" : "Resume"}>
                      {site.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    {site.lastAuditId && (
                      <Link href={`/results/${site.lastAuditId}`}>
                        <Button size="sm" variant="ghost" title="Open results"><ExternalLink className="h-4 w-4" /></Button>
                      </Link>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => removeSite.mutate(site.id)} title="Remove" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {!monitoringLocked && (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2"><Bot className="h-5 w-5 text-emerald-600" /> AI crawler activity</h2>
            <p className="text-sm text-muted-foreground">
              Robots.txt shows which AI bots you <em>allow</em>. This shows which ones actually <em>visit</em>. Add the
              snippet to your site and we'll log real GPTBot / ClaudeBot / PerplexityBot fetches as they happen.
            </p>
          </div>

          {crawler.isLoading ? (
            <div className="h-40 rounded-xl bg-muted/50 animate-pulse" />
          ) : crawler.data ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tracking snippet</CardTitle>
                  <CardDescription>Paste this once into your site's global <code>&lt;head&gt;</code> or footer template.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2">
                    <code className="flex-1 text-xs bg-muted rounded-md p-3 break-all font-mono">{crawler.data.snippet}</code>
                    <Button size="sm" variant="outline" onClick={() => copySnippet(crawler.data!.snippet)}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The pixel is invisible and only ever logs known AI crawlers — never your human visitors, and no IP addresses.
                  </p>
                </CardContent>
              </Card>

              {crawler.data.total === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    No AI crawler visits logged yet. Once the snippet is live, fetches from GPTBot, ClaudeBot, PerplexityBot
                    and others will appear here within minutes of a crawl.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{crawler.data.total.toLocaleString()} AI crawler hits</CardTitle>
                      <CardDescription>By bot, all time</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {crawler.data.byCrawler.map((c) => (
                        <div key={c.crawler} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{c.crawler}</span>
                          <span className="text-muted-foreground text-xs">
                            {c.count.toLocaleString()} · last {fmtDate(c.lastSeen)}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Last 14 days</CardTitle>
                      <CardDescription>Daily AI crawler hits</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={crawler.data.daily.map((d) => ({ name: d.day.slice(5), hits: d.count }))} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                            <RechartsTooltip />
                            <Bar dataKey="hits" fill="#10b981" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {crawler.data.recent.length > 0 && (
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Recent visits</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1.5">
                        {crawler.data.recent.slice(0, 10).map((r, i) => (
                          <div key={i} className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-medium shrink-0">{r.crawler}</span>
                            <span className="text-muted-foreground truncate flex-1">{r.path || "/"}</span>
                            <span className="text-muted-foreground shrink-0">{fmtDate(r.createdAt)}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {!monitoringLocked && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><LineChartIcon className="h-5 w-5 text-emerald-600" /> Traffic impact</h2>
          <GoogleAnalyticsSection />
        </div>
      )}
    </div>
  );
}
