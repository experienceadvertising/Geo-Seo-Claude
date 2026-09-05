type ProgressTarget = {
  active: boolean;
  latest?: { collected_at: string; result_url?: string | null } | null;
  collection?: { status: string; created_at: string } | null;
};
export function searchPropertyMatchesPage(siteUrl: string, pageUrl: string): boolean {
  try {
    const page = new URL(pageUrl);
    if (siteUrl.startsWith("sc-domain:")) {
      const domain = siteUrl.slice(10).toLowerCase();
      return page.hostname === domain || page.hostname.endsWith(`.${domain}`);
    }
    return page.href.startsWith(new URL(siteUrl).href);
  } catch { return false; }
}
export function collectionMessage(target: ProgressTarget, configured: boolean, now = Date.now()): string {
  if (!target.active) return "Paused. Previous results are preserved.";
  if (!configured) return "Provider unavailable. Previous results are preserved.";
  const collected = target.latest ? Date.parse(target.latest.collected_at) : 0;
  const attempted = target.collection ? Date.parse(target.collection.created_at) : 0;
  if (target.collection?.status === "queued") return "Collection queued. Check back for your result.";
  if (target.collection?.status === "failed" && attempted > collected) return "Last collection failed. Automatic retry pending; previous results are preserved.";
  if (!collected) return "Awaiting first collection. No manual refresh is required; check back for your baseline.";
  if (now - collected > 8 * 86400000) return "Results are overdue. Previous data is shown; check collection status before drawing conclusions.";
  return "Baseline recorded. Weekly tracking will show changes over time.";
}
export function landingPageDiffers(expected?: string | null, actual?: string | null): boolean {
  if (!expected || !actual) return false;
  try {
    const a = new URL(expected); const b = new URL(actual);
    return a.hostname.replace(/^www\./, "") !== b.hostname.replace(/^www\./, "")
      || a.pathname.replace(/\/$/, "") !== b.pathname.replace(/\/$/, "") || a.search !== b.search;
  } catch { return false; }
}
