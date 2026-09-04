import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { searchPropertyMatchesPage } from "@/lib/seoProgress";

type Period = { clicks: number; impressions: number; ctr: number; position: number; startDate: string; endDate: string };
type Performance = { current: Period; previous: Period; opportunities: { query: string; clicks: number; impressions: number; position: number; recommendedAction: string }[] };

export function SeoPerformancePanel({ pageUrl }: { pageUrl: string }) {
  const status = useQuery<{ connected: boolean; searchConsoleGranted: boolean }>({
    queryKey: ["google", "status"], queryFn: () => customFetch("/api/integrations/google/status"), retry: false,
  });
  const connected = Boolean(status.data?.connected && status.data.searchConsoleGranted);
  const sites = useQuery<{ sites: { siteUrl: string }[] }>({
    queryKey: ["google", "search-console", "sites"], queryFn: () => customFetch("/api/integrations/google/search-console/sites"), enabled: connected, retry: false,
  });
  // Never default to an unrelated property in an agency's Google account.
  const property = sites.data?.sites.find(({ siteUrl }) => searchPropertyMatchesPage(siteUrl, pageUrl))?.siteUrl;
  const performance = useQuery<Performance>({
    queryKey: ["seo-page-performance", property, pageUrl],
    queryFn: () => customFetch(`/api/integrations/google/search-console/performance?siteUrl=${encodeURIComponent(property!)}&pageUrl=${encodeURIComponent(pageUrl)}`),
    enabled: Boolean(property), retry: false, staleTime: 5 * 60_000,
  });
  const error = status.error || sites.error || performance.error;
  return <section className="mt-4 rounded-lg border bg-background p-4 space-y-3" aria-label="Search Console page performance">
    <h3 className="text-sm font-semibold">Your Google search performance</h3>
    <p className="break-all text-xs text-muted-foreground">Page: {pageUrl}</p>
    {error ? <div role="status" className="text-sm"><p>Search Console data could not load. No missing results have been replaced with zeroes.</p><Button variant="outline" size="sm" onClick={() => { void status.refetch(); if (connected) void sites.refetch(); if (property) void performance.refetch(); }}>Try again</Button></div>
      : status.isLoading || (connected && sites.isLoading) || (property && performance.isLoading) ? <p role="status" className="text-sm">Loading your page's search performance…</p>
      : !connected ? <p className="text-sm">Connect Search Console to see actual search traffic alongside your audit. <Link className="underline" href="/projects">Review Google connections</Link>.</p>
      : !property ? <p className="text-sm">No connected Search Console property matches this page. <Link className="underline" href="/projects">Review your connection</Link>. We will not substitute another site's data.</p>
      : performance.data ? <>
        <p className="text-xs text-muted-foreground">{performance.data.current.startDate} to {performance.data.current.endDate}, compared with {performance.data.previous.startDate} to {performance.data.previous.endDate}. Google reporting has a delay.</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{([
          ["Clicks", "clicks"], ["Impressions", "impressions"], ["CTR", "ctr"], ["Average position", "position"],
        ] as const).map(([label, key]) => {
          const format = (period: Period) => key === "position" && !period.impressions ? "Not available" : key === "ctr" ? `${(period[key] * 100).toFixed(1)}%` : key === "position" ? period[key].toFixed(1) : period[key].toLocaleString();
          return <div key={key}><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold">{format(performance.data!.current)}</p><p className="text-xs text-muted-foreground">Previously {format(performance.data!.previous)}</p></div>;
        })}</div>
        <p className="text-xs text-muted-foreground">Average position is Google's aggregated metric, not the same measurement as a DataForSEO location and device snapshot.</p>
        <h4 className="text-sm font-medium">Search opportunities to review next</h4>
        {performance.data.opportunities.length ? <ul className="space-y-3">{performance.data.opportunities.slice(0, 3).map((item) => <li key={item.query} className="rounded border p-3 text-sm"><strong>{item.query}</strong><p className="text-xs text-muted-foreground">90-day query window: {item.impressions.toLocaleString()} impressions · Average position {item.position.toFixed(1)}</p><p className="mt-1">{item.recommendedAction}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">No qualifying queries were returned for this exact page. Start with a few relevant buyer keywords below, improve your highest-priority audit finding, and compare again after data has accumulated.</p>}
      </> : null}
  </section>;
}
