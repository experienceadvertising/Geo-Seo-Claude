import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";

type Target = { id: number; keyword: string; locationName: string; device: string; active: boolean; latest?: { position: number | null; result_present: boolean; collected_at: string } | null };
type KeywordResponse = { targets: Target[]; limits: { activeKeywords: number }; providerConfigured: boolean };

function apiMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.data && typeof error.data === "object" && "error" in error.data) {
    const message = (error.data as { error?: unknown }).error;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export function SeoTrackingPanel({ domain }: { domain: string }) {
  const client = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const { data, error } = useQuery<KeywordResponse>({
    queryKey: ["seo-keywords", domain], queryFn: () => customFetch(`/api/seo/keywords?domain=${encodeURIComponent(domain)}`), retry: false,
  });
  const add = useMutation({ mutationFn: () => customFetch("/api/seo/keywords", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain, keyword }) }), onSuccess: () => { setKeyword(""); client.invalidateQueries({ queryKey: ["seo-keywords", domain] }); } });
  const refresh = useMutation({ mutationFn: (id: number) => customFetch(`/api/seo/keywords/${id}/refresh`, { method: "POST" }), onSuccess: () => client.invalidateQueries({ queryKey: ["seo-keywords", domain] }) });
  if (error instanceof ApiError && error.status === 403) return <p className="text-xs text-muted-foreground">Paid plans can connect Search Console and manage weekly rank tracking.</p>;
  if (error) return <p className="text-xs text-destructive">Rank tracking could not load. Your audit and Search Console tools are still available.</p>;
  return <div className="mt-5 rounded-lg border bg-background p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">Controlled keyword tracking</p><p className="text-xs text-muted-foreground">Weekly Google rank snapshots by keyword, location, and device. Manual refreshes are capped by plan.</p></div><span className="text-xs text-muted-foreground">{data?.targets?.filter((target) => target.active).length ?? 0}/{data?.limits.activeKeywords ?? "..."} active</span></div>
    {data && !data.providerConfigured && <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">Rank tracking is not connected yet. AEO audits and Search Console features continue to work normally.</p>}
    <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (keyword.trim()) add.mutate(); }}><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Add a target keyword" maxLength={250} /><Button type="submit" size="sm" disabled={add.isPending}>{add.isPending ? "Adding" : "Track keyword"}</Button></form>
    {add.error && <p className="mt-2 text-xs text-destructive">{apiMessage(add.error, "Could not add keyword.")}</p>}
    {data?.targets?.length ? <ul className="mt-4 divide-y text-sm">{data.targets.slice(0, 10).map((target) => <li key={target.id} className="flex items-center justify-between gap-3 py-2"><div><span className="font-medium">{target.keyword}</span><span className="ml-2 text-xs text-muted-foreground">{target.locationName} · {target.device} · {target.latest?.position ? `Position ${target.latest.position}` : "No matching result yet"}</span></div><Button variant="outline" size="sm" disabled={refresh.isPending || !target.active || !data.providerConfigured} onClick={() => refresh.mutate(target.id)}><RefreshCw className="mr-1 h-3 w-3" />Refresh</Button></li>)}</ul> : <p className="mt-3 text-xs text-muted-foreground">Add a high-value keyword now, or import a query from the Search Console opportunity view.</p>}
    {refresh.error && <p className="mt-2 text-xs text-destructive">{apiMessage(refresh.error, "Could not refresh this rank.")}</p>}
  </div>;
}
