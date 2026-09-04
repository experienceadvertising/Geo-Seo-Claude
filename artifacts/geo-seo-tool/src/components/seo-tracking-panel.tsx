import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, PauseCircle, PlayCircle, RefreshCw, SlidersHorizontal } from "lucide-react";
import { latestRankDisplay } from "@/lib/rankTrackingDisplay";

type RankSnapshot = {
  id: number;
  position: number | null;
  resultPresent?: boolean;
  result_present?: boolean;
  collectedAt?: string;
  collected_at?: string;
};
type Target = { id: number; keyword: string; locationName: string; device: string; targetUrl?: string | null; active: boolean; latest?: { position: number | null; result_present: boolean; collected_at: string } | null };
type KeywordResponse = { targets: Target[]; limits: { activeKeywords: number }; providerConfigured: boolean };
type OverviewResponse = { limits: { activeKeywords: number; manualRefreshes: number }; usage: { activeKeywords: number; manualRefreshes: number } };
type HistoryResponse = { snapshots: RankSnapshot[] };

function apiMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.data && typeof error.data === "object" && "error" in error.data) {
    const message = (error.data as { error?: unknown }).error;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function snapshotDate(snapshot: RankSnapshot): string {
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

export function SeoTrackingPanel({ domain }: { domain: string }) {
  const client = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [locationCode, setLocationCode] = useState(2840);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [targetUrl, setTargetUrl] = useState(`https://${domain}`);
  const [showOptions, setShowOptions] = useState(false);
  const [openHistoryId, setOpenHistoryId] = useState<number | null>(null);
  useEffect(() => {
    setTargetUrl(`https://${domain}`);
    setKeyword("");
    setOpenHistoryId(null);
  }, [domain]);
  const queryKey = ["seo-keywords", domain];
  const overviewKey = ["seo-overview", domain];
  const { data, error } = useQuery<KeywordResponse>({
    queryKey, queryFn: () => customFetch(`/api/seo/keywords?domain=${encodeURIComponent(domain)}`), retry: false,
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
    <form className="mt-3 space-y-3" onSubmit={(event) => { event.preventDefault(); if (keyword.trim()) add.mutate(); }}>
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
    {add.error && <p className="mt-2 text-xs text-destructive">{apiMessage(add.error, "Could not add keyword.")}</p>}
    {data?.targets?.length ? <ul className="mt-4 divide-y text-sm">{data.targets.map((target) => {
      const historyOpen = openHistoryId === target.id;
      return <li key={target.id} className="py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><span className="font-medium">{target.keyword}</span>{!target.active && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">Paused</span>}<span className="block text-xs text-muted-foreground sm:inline sm:ml-2">{target.locationName} · {target.device} · {latestRankDisplay(target.latest)}</span>{target.targetUrl && <span className="block max-w-xl truncate text-xs text-muted-foreground" title={target.targetUrl}>Watching {target.targetUrl}</span>}</div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpenHistoryId(historyOpen ? null : target.id)}>{historyOpen ? <ChevronUp className="mr-1 h-3 w-3" /> : <ChevronDown className="mr-1 h-3 w-3" />}History</Button>
            <Button variant="outline" size="sm" disabled={refresh.isPending || !target.active || !data.providerConfigured || refreshesRemaining === 0} onClick={() => refresh.mutate(target.id)}><RefreshCw className="mr-1 h-3 w-3" />Refresh</Button>
            <Button variant="outline" size="sm" disabled={toggle.isPending} onClick={() => toggle.mutate({ id: target.id, active: !target.active })}>{target.active ? <PauseCircle className="mr-1 h-3 w-3" /> : <PlayCircle className="mr-1 h-3 w-3" />}{target.active ? "Pause" : "Resume"}</Button>
          </div>
        </div>
        <RankHistory targetId={target.id} open={historyOpen} />
      </li>;
    })}</ul> : <p className="mt-3 text-xs text-muted-foreground">Add a high-value keyword now, or import a query from the Search Console opportunity view.</p>}
    {refresh.error && <p className="mt-2 text-xs text-destructive">{apiMessage(refresh.error, "Could not refresh this rank.")}</p>}
    {toggle.error && <p className="mt-2 text-xs text-destructive">{apiMessage(toggle.error, "Could not update this keyword.")}</p>}
  </div>;
}
