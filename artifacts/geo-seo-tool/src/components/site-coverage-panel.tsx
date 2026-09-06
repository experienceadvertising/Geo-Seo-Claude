import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { CheckCircle2, Compass, ExternalLink, Loader2, ScanSearch } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DiscoveredPage = { url: string; priority: string };
type DiscoveryResponse = { pages: DiscoveredPage[]; source: "sitemap" | "homepage"; limit: number; plan: string };
type AuditHistoryItem = { id: number; url: string; geoScore: number; createdAt: string };
type ScanResult = { url: string; id?: number; error?: string };

function pageKey(raw: string): string {
  try {
    const url = new URL(raw);
    return `${url.hostname.replace(/^www\./, "").toLowerCase()}${url.pathname.replace(/\/+$/, "") || "/"}`;
  } catch { return raw; }
}

function displayPage(raw: string): string {
  try {
    const url = new URL(raw);
    return url.pathname === "/" ? "Homepage" : url.pathname.replace(/\/+$/, "");
  } catch { return raw; }
}

export function SiteCoveragePanel({ siteUrl, history }: { siteUrl: string; history: AuditHistoryItem[] }) {
  const queryClient = useQueryClient();
  const [pages, setPages] = useState<DiscoveredPage[]>([]);
  const [source, setSource] = useState<DiscoveryResponse["source"] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number } | null>(null);
  const auditedByPage = useMemo(() => {
    const result = new Map<string, AuditHistoryItem>();
    for (const item of history) if (!result.has(pageKey(item.url))) result.set(pageKey(item.url), item);
    return result;
  }, [history]);

  const discover = useMutation({
    mutationFn: () => customFetch<DiscoveryResponse>(`/api/geo/site-pages?url=${encodeURIComponent(siteUrl)}`),
    onSuccess: (data) => {
      setPages(data.pages);
      setSource(data.source);
      setScanResults([]);
      setSelected(new Set(data.pages.filter((page) => !auditedByPage.has(pageKey(page.url))).slice(0, 3).map((page) => page.url)));
    },
  });

  const scanSelected = async () => {
    const queue = pages.filter((page) => selected.has(page.url) && !auditedByPage.has(pageKey(page.url)));
    if (!queue.length) return;
    setScanResults([]);
    setScanProgress({ current: 0, total: queue.length });
    const completed: ScanResult[] = [];
    for (let index = 0; index < queue.length; index += 1) {
      const page = queue[index];
      setScanProgress({ current: index + 1, total: queue.length });
      try {
        const audit = await customFetch<{ id: number }>("/api/geo/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: page.url }),
        });
        completed.push({ url: page.url, id: audit.id });
      } catch (error) {
        completed.push({ url: page.url, error: error instanceof Error ? error.message : "Scan failed" });
      }
      setScanResults([...completed]);
    }
    setScanProgress(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["audit-history"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/geo/audits"] }),
    ]);
  };

  const pendingSelected = pages.filter((page) => selected.has(page.url) && !auditedByPage.has(pageKey(page.url))).length;

  return (
    <Card className="border-cyan-200" id="site-coverage">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Compass className="h-4 w-4 text-cyan-700" /> Important page coverage</CardTitle>
        <CardDescription>Find the pages that explain your brand, offers, proof, and pricing. Scan them together so your plan is based on more than the homepage.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!pages.length && (
          <Button variant="outline" onClick={() => discover.mutate()} disabled={discover.isPending}>
            {discover.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-2 h-4 w-4" />}
            {discover.isPending ? "Reading sitemap and links" : "Find important pages"}
          </Button>
        )}
        {discover.error && <p role="alert" className="text-sm text-destructive">{discover.error instanceof Error ? discover.error.message : "Important pages could not be loaded."}</p>}
        {pages.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Found from the site's {source === "sitemap" ? "sitemap" : "homepage links"}. Select only pages you want to spend an audit on.</p>
              <Button size="sm" variant="ghost" onClick={() => discover.mutate()} disabled={discover.isPending}>Refresh page list</Button>
            </div>
            <ul className="divide-y rounded-lg border">
              {pages.map((page) => {
                const prior = auditedByPage.get(pageKey(page.url));
                const checked = selected.has(page.url);
                return (
                  <li key={page.url} className="flex items-start gap-3 p-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={Boolean(prior) || checked}
                      disabled={Boolean(prior) || Boolean(scanProgress)}
                      onChange={() => setSelected((current) => {
                        const next = new Set(current);
                        if (next.has(page.url)) next.delete(page.url); else next.add(page.url);
                        return next;
                      })}
                      aria-label={`Select ${displayPage(page.url)} for scanning`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium break-all">{displayPage(page.url)}</p>
                      <p className="text-xs text-muted-foreground">{page.priority} · {page.url}</p>
                    </div>
                    {prior ? <Link href={`/results/${prior.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Audited</Link> : <a href={page.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground" aria-label={`Open ${page.url}`}><ExternalLink className="h-4 w-4" /></a>}
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">Each selected page uses one audit from your monthly allowance. Failed site fetches are refunded.</p>
              <Button onClick={scanSelected} disabled={!pendingSelected || Boolean(scanProgress)}>
                {scanProgress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-2 h-4 w-4" />}
                {scanProgress ? `Scanning ${scanProgress.current} of ${scanProgress.total}` : `Scan ${pendingSelected} selected page${pendingSelected === 1 ? "" : "s"}`}
              </Button>
            </div>
          </>
        )}
        {scanResults.length > 0 && (
          <div className="rounded-lg border bg-muted/20 p-3">
            <p className="text-sm font-semibold">Page scan results</p>
            <ul className="mt-2 space-y-2 text-sm">
              {scanResults.map((result) => <li key={result.url} className="flex items-center justify-between gap-3"><span className="truncate">{displayPage(result.url)}</span>{result.id ? <Link href={`/actions/${result.id}`} className="font-semibold text-primary underline">Open action plan</Link> : <span className="text-xs text-destructive">Could not scan</span>}</li>)}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
