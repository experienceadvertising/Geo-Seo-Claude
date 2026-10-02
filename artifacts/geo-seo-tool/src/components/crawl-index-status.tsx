import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface InspectionReport {
  siteUrl: string; pageUrl: string; observedAt: string;
  lastCrawlTime: string | null; daysSinceLastCrawl: number | null;
  crawlAttention: "unavailable" | "recent" | "review" | "extended_gap" | "long_gap";
  verdict: string | null; coverageState: string | null;
  robotsTxtState: string | null; indexingState: string | null; pageFetchState: string | null;
  googleCanonical: string | null; userCanonical: string | null; nextSteps: string[];
}

const labels: Record<InspectionReport["crawlAttention"], string> = {
  unavailable: "Crawl date unavailable", recent: "Recent crawl reported", review: "Review crawl attention",
  extended_gap: "Extended time since crawl", long_gap: "Long gap since crawl",
};

export function CrawlIndexStatus({ auditId, siteUrl }: { auditId: number; siteUrl: string }) {
  const inspection = useQuery<InspectionReport>({
    queryKey: ["google", "inspection", auditId, siteUrl],
    queryFn: () => customFetch<InspectionReport>(`/api/integrations/google/search-console/inspection?auditId=${auditId}&siteUrl=${encodeURIComponent(siteUrl)}`),
    enabled: false, retry: false, staleTime: 3_600_000,
  });
  const report = inspection.data;
  return <section className="border-t pt-4 space-y-3" aria-labelledby="crawl-status-heading">
    <h3 id="crawl-status-heading" className="text-sm font-semibold">Crawl and Index Status</h3>
    <p className="text-xs text-muted-foreground">Check Google's reported indexing status and crawl date for this audited page. This is an on-demand check, not continuous monitoring.</p>
    <Button size="sm" variant="outline" disabled={!siteUrl || inspection.isFetching} onClick={() => { void inspection.refetch(); }}>
      {inspection.isFetching ? "Checking Google..." : report ? "Check again" : "Check crawl and index status"}
    </Button>
    {inspection.isFetching && <p role="status" className="text-xs text-muted-foreground">Loading Google's stored inspection data...</p>}
    {inspection.isError && <p role="alert" className="text-sm text-red-700">{inspection.error instanceof Error ? inspection.error.message : "Couldn't inspect this page. Try again later."}</p>}
    {report && <div className="space-y-3">
      <p className="text-sm font-medium">{labels[report.crawlAttention]}{report.daysSinceLastCrawl !== null ? `: ${report.daysSinceLastCrawl} days ago` : ""}</p>
      <dl className="grid sm:grid-cols-2 gap-3 text-xs">
        {[
          ["Google coverage state", report.coverageState], ["Google index verdict", report.verdict],
          ["Last crawl reported by Google", report.lastCrawlTime ? new Date(report.lastCrawlTime).toLocaleString() : null],
          ["Inspection checked", new Date(report.observedAt).toLocaleString()],
          ["Page fetch", report.pageFetchState], ["Robots access", report.robotsTxtState],
          ["Indexing directive", report.indexingState], ["Google canonical", report.googleCanonical],
          ["Declared canonical", report.userCanonical], ["Inspected page", report.pageUrl],
        ].map(([label, value]) => <div key={label}><dt className="font-medium">{label}</dt><dd className="text-muted-foreground break-all mt-1">{value || "Unavailable"}</dd></div>)}
      </dl>
      <p className="text-xs text-muted-foreground">Google's verdict and coverage state describe the indexed version it reports. Indexing allowed describes the page's directives and does not prove it is indexed. Crawl age does not override the reported index status.</p>
      <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">{report.nextSteps.map(step => <li key={step}>{step}</li>)}</ul>
      <Link href={`/actions/${auditId}`} className="text-xs text-emerald-700 underline">Open this page's action plan</Link>
    </div>}
    <p className="text-xs text-muted-foreground">The 130/190-day checkpoints come from <a href="https://indexinginsight.com/blog/190-day-indexing-rule" target="_blank" rel="noreferrer" className="underline">Adam Gent's observational research</a>. They are review signals, not Google deadlines, predicted removal dates or AEO score weights. Checks can reuse data for up to one hour and do not submit a page for indexing.</p>
  </section>;
}