import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, ChevronUp, Copy, PauseCircle, PlayCircle, RefreshCw, SlidersHorizontal } from "lucide-react";
import { latestRankDisplay } from "@/lib/rankTrackingDisplay";
import { collectionMessage, landingPageDiffers } from "@/lib/seoProgress";

type RankSnapshot = {
  id: number;
  position: number | null;
  resultPresent?: boolean;
  result_present?: boolean;
  collectedAt?: string;
  collected_at?: string;
};
type KeywordInsight = { collectedAt: string; sourceUpdatedAt: string | null; intentUpdatedAt: string | null; searchVolume: number | null; intent: string | null; monthlySearches: { year: number; month: number; volume: number | null }[] };
type Target = { id: number; keyword: string; locationName: string; device: string; targetUrl?: string | null; active: boolean; insights?: KeywordInsight | null; collection?: { status: string; created_at: string } | null; latest?: { position: number | null; result_present: boolean; collected_at: string; result_url?: string | null; competitors?: { url: string; domain: string; title: string; position: number }[] | null } | null };
type KeywordResponse = { targets: Target[]; limits: { activeKeywords: number }; providerConfigured: boolean };
type OverviewResponse = { limits: { activeKeywords: number; manualRefreshes: number; keywordInsights?: number }; usage: { activeKeywords: number; manualRefreshes: number; keywordInsights?: number } };
type HistoryResponse = { snapshots: RankSnapshot[] };

function apiMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.data && typeof error.data === "object" && "error" in error.data) {
    const message = (error.data as { error?: unknown }).error;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function snapshotDate(snapshot: { collectedAt?: string; collected_at?: string }): string {
  const value = snapshot.collectedAt ?? snapshot.collected_at;
  if (!value) return "Unknown date";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function snapshotPosition(snapshot: RankSnapshot): string {
  return latestRankDisplay({ position: snapshot.position, result_present: snapshot.resultPresent ?? snapshot.result_present ?? true });
}

function RankHistory({ targetId, open }: { targetId: number; open: boolean }) {
  const { data, isLoading, error } = useQuery<HistoryResponse>({
    queryKey: ["seo-keyword-history", targetId],
    queryFn: () => customFetch(`/api/seo/keywords/${targetId}/history`),
    enabled: open,
    retry: false,
  });
  if (!open) return null;
  if (isLoading) return <p className="mt-2 text-xs text-muted-foreground">Loading ranking history…</p>;
  if (error) return <p className="mt-2 text-xs text-destructive">Ranking history could not load. Existing snapshots are still preserved.</p>;
  const snapshots = data?.snapshots ?? [];
  if (!snapshots.length) return <p className="mt-2 text-xs text-muted-foreground">No snapshots yet. Weekly collection and manual refreshes will build this history.</p>;
  const first = snapshots[0];
  const latest = snapshots[snapshots.length - 1];
  const movement = first.position && latest.position ? first.position - latest.position : null;
  return (
    <div className="mt-3 rounded-md bg-muted/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-medium">Ranking history</span>
        <span className="text-muted-foreground">
          Baseline {snapshotPosition(first)} · Latest {snapshotPosition(latest)}
          {movement !== null && movement !== 0 ? ` · ${movement > 0 ? `Up ${movement}` : `Down ${Math.abs(movement)}`}` : ""}
        </span>
      </div>
      <ul className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        {snapshots.slice(-8).reverse().map((snapshot) => (
          <li key={snapshot.id} className="flex justify-between gap-3 rounded bg-background px-2 py-1.5">
            <span>{snapshotDate(snapshot)}</span>
            <span className="font-medium text-foreground">{snapshotPosition(snapshot)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KeywordContext({ target }: { target: Target }) {
  const [copied, setCopied] = useState(false);
  const insight = target.insights;
  const stale = insight && Date.now() - Date.parse(insight.collectedAt) >= 30 * 86400000;
  const guidance: Record<string, string> = {
    commercial: "Help buyers compare options with concrete differences, pricing context, and evidence.",
    transactional: "Make the offer, purchase or booking step, and key decision details easy to find.",
    informational: "Answer the question directly, then add useful examples and first-party evidence.",
    navigational: "Make the relevant brand or product page easy to identify and navigate to.",
  };
  const competitors = target.latest?.competitors;
  const copyGapReview = async () => {
    if (!competitors?.length) return;
    const brief = `Search result gap review for: ${target.keyword}\nLocation: ${target.locationName}\nDevice: ${target.device}\nTracked page: ${target.targetUrl || "Not set"}\n\nPages currently ahead:\n${competitors.map((item) => `${item.position}. ${item.title || item.domain}\n${item.url}`).join("\n\n")}\n\nReview each page for:\n1. The search intent it satisfies.\n2. Useful sections or questions your page does not address.\n3. First-party evidence, examples, or methodology it provides.\n4. Important facts it supports with original sources.\n5. A clearer or more useful angle your company can publish without copying.\n\nChoose one verified gap, improve the tracked page, publish, and compare future snapshots. Ranking movement does not prove the change caused it.`;
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return <details className="mt-3 rounded-md border p-3 text-xs">
    <summary className="cursor-pointer font-semibold">Keyword insights and search competitors</summary>
    <div className="mt-3 space-y-3">
      {insight ? <>
        <p>Estimated monthly searches: <strong>{insight.searchVolume === null ? "Unavailable" : insight.searchVolume.toLocaleString()}</strong> · Estimated intent: <strong>{insight.intent ?? "Unavailable"}</strong></p>
        <p className="text-muted-foreground">DataForSEO Keyword Database · {target.locationName} · Language of this target · All devices, not device-specific. These are market estimates, not your site's traffic.</p>
        <p className="text-muted-foreground">Collected {new Date(insight.collectedAt).toLocaleDateString()}{stale ? " (stale; eligible for a new lookup subject to allowance)" : " (cached for 30 days)"}. Volume source updated: {insight.sourceUpdatedAt ?? "Unavailable"}. Intent source updated: {insight.intentUpdatedAt ?? "Unavailable"}.</p>
        {insight.intent && <p><strong>What to do next:</strong> {guidance[insight.intent]} Validate this suggestion against the actual search results before changing your page.</p>}
        {insight.monthlySearches.length > 0 && <div className="overflow-x-auto"><table className="w-full text-left"><caption className="mb-2 text-left font-semibold">Monthly demand history: look for seasonal patterns, not guaranteed future demand</caption><thead><tr><th className="p-1">Month</th><th className="p-1">Estimated searches</th></tr></thead><tbody>{insight.monthlySearches.map(row => <tr key={`${row.year}-${row.month}`}><td className="p-1">{row.year}-{String(row.month).padStart(2, "0")}</td><td className="p-1">{row.volume === null ? "Unavailable" : row.volume.toLocaleString()}</td></tr>)}</tbody></table></div>}
      </> : <p>No keyword demand data yet. Use “Update keyword insights” above. Missing provider data is not treated as zero searches.</p>}
      <p className="font-semibold">{target.latest?.result_present ? "Who appeared above you?" : "Leading search results to review"}</p>
      {competitors == null ? <p>Competitor context will be saved with the next successful rank check. Historical snapshots have not been backfilled.</p> : competitors.length ? <><ul className="space-y-2">{competitors.map(item => <li key={`${item.position}-${item.url}`}><a className="text-primary underline break-words" href={item.url} target="_blank" rel="noopener noreferrer">#{item.position} · {item.title || item.domain}</a><span className="block text-muted-foreground">{item.domain}</span></li>)}</ul><p>Compare intent, evidence, useful sections, and source quality. These are search competitors, not necessarily business competitors. Do not copy their content. Positions use the same location, device, and collection time as your rank snapshot.</p><Button type="button" variant="outline" size="sm" onClick={copyGapReview}>{copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}{copied ? "Gap review copied" : "Copy content gap review"}</Button></> : <p>No qualifying results ahead of your page were captured in this snapshot.</p>}
    </div>
  </details>;
}

export function SeoTrackingPanel({ domain, pageUrl }: { domain: string; pageUrl?: string }) {
  const client = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [locationCode, setLocationCode] = useState(2840);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [targetUrl, setTargetUrl] = useState(pageUrl || `https://${domain}`);
  const [showOptions, setShowOptions] = useState(true);
  const [openHistoryId, setOpenHistoryId] = useState<number | null>(null);
  useEffect(() => {
    setTargetUrl(pageUrl || `https://${domain}`);
    setKeyword("");
    setOpenHistoryId(null);
  }, [domain, pageUrl]);
  const queryKey = ["seo-keywords", domain];
  const overviewKey = ["seo-overview", domain];
  const { data, error } = useQuery<KeywordResponse>({
    queryKey, queryFn: () => customFetch(`/api/seo/keywords?domain=${encodeURIComponent(domain)}`), retry: false, refetchInterval: 60_000,
  });
  const { data: overview } = useQuery<OverviewResponse>({
    queryKey: overviewKey, queryFn: () => customFetch(`/api/seo/overview?domain=${encodeURIComponent(domain)}`), retry: false,
  });
  const invalidate = () => {
    client.invalidateQueries({ queryKey });
    client.invalidateQueries({ queryKey: overviewKey });
  };
  const selectedLocation = [
    { code: 2840, name: "United States" },
    { code: 2124, name: "Canada" },
    { code: 2826, name: "United Kingdom" },
    { code: 2036, name: "Australia" },
  ].find((location) => location.code === locationCode)!;
  const add = useMutation({
    mutationFn: () => customFetch("/api/seo/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain,
        keyword,
        locationCode,
        locationName: selectedLocation.name,
        languageCode: "en",
        device,
        targetUrl: targetUrl.trim() || undefined,
      }),
    }),
    onSuccess: () => { setKeyword(""); invalidate(); },
  });
  const refresh = useMutation({ mutationFn: (id: number) => customFetch(`/api/seo/keywords/${id}/refresh`, { method: "POST" }), onSuccess: (_result, id) => { invalidate(); client.invalidateQueries({ queryKey: ["seo-keyword-history", id] }); } });
  const toggle = useMutation({ mutationFn: ({ id, active }: { id: number; active: boolean }) => customFetch(`/api/seo/keywords/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) }), onSuccess: invalidate });
  const enrich = useMutation<{ updated: number; failed: number; message: string }>({ mutationFn: () => customFetch("/api/seo/insights/refresh", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain }) }), onSuccess: invalidate });
  if (error instanceof ApiError && error.status === 403) return <p className="text-xs text-muted-foreground">Pro and Agency plans can connect Search Console and manage weekly rank tracking.</p>;
  if (error) return <p className="text-xs text-destructive">Rank tracking could not load. Your audit and Search Console tools are still available.</p>;
  const refreshesRemaining = overview ? Math.max(0, overview.limits.manualRefreshes - overview.usage.manualRefreshes) : null;
  return <div className="mt-5 rounded-lg border bg-background p-4">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><p className="text-sm font-semibold">Controlled keyword tracking</p><p className="text-xs text-muted-foreground">Weekly Google rank snapshots by keyword, location, and device.</p></div>
      <div className="text-right text-xs text-muted-foreground">
        <p>{overview?.usage.activeKeywords ?? data?.targets?.filter((target) => target.active).length ?? 0}/{overview?.limits.activeKeywords ?? data?.limits.activeKeywords ?? "..."} active keywords</p>
        <p>{refreshesRemaining === null ? "Loading refresh allowance…" : `${refreshesRemaining}/${overview!.limits.manualRefreshes} manual refreshes left this month`}</p>
      </div>
    </div>
    {data && !data.providerConfigured && <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">Rank tracking is not connected yet. AEO audits and Search Console features continue to work normally.</p>}
    <p className="mt-3 text-xs text-muted-foreground">Start with a few buyer searches that matter to your business. Establish a baseline, improve the relevant page, then compare weekly results. Each check requests up to 100 Google results; not being found does not mean your site is absent from all Google results.</p>
    <div className="my-4 space-y-2 rounded-lg border bg-muted/20 p-3">
      <p className="text-sm font-semibold">Choose keywords with demand and intent in mind</p>
      <p className="text-xs text-muted-foreground">Look up volume, monthly demand, and estimated intent for active targets on this site. Cached for 30 days. The monthly allowance is shared across all your sites: {overview?.usage.keywordInsights ?? 0}/{overview?.limits.keywordInsights ?? "..."} target lookups used. Attempts, including unavailable results, count. No lookups run just by opening this page.</p>
      <Button variant="outline" size="sm" onClick={() => enrich.mutate()} disabled={enrich.isPending || !data?.providerConfigured || !data.targets.some(target => target.active) || (overview?.limits.keywordInsights !== undefined && (overview.usage.keywordInsights ?? 0) >= overview.limits.keywordInsights)}>{enrich.isPending ? "Looking up keyword insights..." : "Update keyword insights"}</Button>
      {enrich.data && <p role="status" className="text-xs">{enrich.data.updated} updated. {enrich.data.message}</p>}
      {enrich.error && <p role="alert" className="text-xs text-destructive">{apiMessage(enrich.error, "Keyword insights could not update. Saved data is preserved.")}</p>}
    </div>
    <form className="mt-3 space-y-3" onSubmit={(event) => { event.preventDefault(); if (keyword.trim()) add.mutate(); }}>
      <p className="text-xs font-medium">1. Choose a buyer search. 2. Confirm your page, country, and device. 3. Add the target and return here to review collection status.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input aria-label="Keyword to track" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Add a target keyword" maxLength={250} />
        <Button type="button" variant="outline" size="sm" className="sm:h-10" onClick={() => setShowOptions((value) => !value)} aria-expanded={showOptions}>
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" /> Location and page
        </Button>
        <Button type="submit" size="sm" className="sm:h-10" disabled={add.isPending || !keyword.trim()}>{add.isPending ? "Adding" : "Track keyword"}</Button>
      </div>
      {showOptions && (
        <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium">
            Search location
            <select aria-label="Search location" value={locationCode} onChange={(event) => setLocationCode(Number(event.target.value))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value={2840}>United States</option>
              <option value={2124}>Canada</option>
              <option value={2826}>United Kingdom</option>
              <option value={2036}>Australia</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium">
            Device
            <select aria-label="Search device" value={device} onChange={(event) => setDevice(event.target.value as "desktop" | "mobile")} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium sm:col-span-2">
            Landing page to watch
            <Input aria-label="Tracked landing page" type="url" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder={`https://${domain}/important-page`} />
          </label>
          <p className="text-xs leading-relaxed text-muted-foreground sm:col-span-2">Each keyword, location, and device combination counts as one target. The landing page helps you spot when Google ranks a different page than the one you intended.</p>
        </div>
      )}
    </form>
    {add.isSuccess && <p role="status" className="mt-2 text-xs text-emerald-700">Keyword saved. Its first snapshot is not available yet. Review the collection status below; you do not need to spend a manual refresh to finish setup.</p>}
    {add.error && <p className="mt-2 text-xs text-destructive">{apiMessage(add.error, "Could not add keyword.")}</p>}
    {data?.targets?.length ? <ul className="mt-4 divide-y text-sm">{data.targets.map((target) => {
      const historyOpen = openHistoryId === target.id;
      return <li key={target.id} className="py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><span className="font-medium">{target.keyword}</span>{!target.active && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">Paused</span>}<span className="block text-xs text-muted-foreground sm:inline sm:ml-2">{target.locationName} · {target.device} · {latestRankDisplay(target.latest)}</span>{target.targetUrl && <span className="block max-w-xl truncate text-xs text-muted-foreground" title={target.targetUrl}>Watching {target.targetUrl}</span>}</div>
          <div className="flex flex-wrap gap-2">
            <Button aria-label={`Ranking history for ${target.keyword}`} aria-expanded={historyOpen} variant="ghost" size="sm" onClick={() => setOpenHistoryId(historyOpen ? null : target.id)}>{historyOpen ? <ChevronUp className="mr-1 h-3 w-3" /> : <ChevronDown className="mr-1 h-3 w-3" />}History</Button>
            <Button variant="outline" size="sm" disabled={refresh.isPending || !target.active || !data.providerConfigured || refreshesRemaining === 0} onClick={() => refresh.mutate(target.id)}><RefreshCw className="mr-1 h-3 w-3" />Refresh</Button>
            <Button variant="outline" size="sm" disabled={toggle.isPending} onClick={() => toggle.mutate({ id: target.id, active: !target.active })}>{target.active ? <PauseCircle className="mr-1 h-3 w-3" /> : <PlayCircle className="mr-1 h-3 w-3" />}{target.active ? "Pause" : "Resume"}</Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground" role="status">{collectionMessage(target, data.providerConfigured)}</p>
        {target.latest && <p className="mt-1 text-xs text-muted-foreground">Last checked: {snapshotDate(target.latest)}. Next scheduled collection becomes eligible {new Date(Date.parse(target.latest.collected_at) + 7 * 86400000).toLocaleDateString("en-US")}.</p>}
        {target.latest?.result_url && <p className="mt-1 break-all text-xs">Page found: {target.latest.result_url}</p>}
        {landingPageDiffers(target.targetUrl, target.latest?.result_url) && <p className="mt-1 text-xs text-amber-700">Google returned a different page. Review whether that page fits this search before changing your intended landing page.</p>}
        <RankHistory targetId={target.id} open={historyOpen} />
        <KeywordContext target={target} />
      </li>;
    })}</ul> : <p className="mt-3 text-xs text-muted-foreground">Add a high-value keyword now, or import a query from the Search Console opportunity view.</p>}
    {refresh.error && <p className="mt-2 text-xs text-destructive">{apiMessage(refresh.error, "Could not refresh this rank.")}</p>}
    {toggle.error && <p className="mt-2 text-xs text-destructive">{apiMessage(toggle.error, "Could not update this keyword.")}</p>}
  </div>;
}
