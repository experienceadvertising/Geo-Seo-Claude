export interface IndexStatus {
  verdict?: string;
  coverageState?: string;
  lastCrawlTime?: string;
  robotsTxtState?: string;
  indexingState?: string;
  pageFetchState?: string;
  googleCanonical?: string;
  userCanonical?: string;
}

export interface InspectionResponse {
  inspectionResult?: { indexStatusResult?: IndexStatus; inspectionResultLink?: string };
}

export class InspectionError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export function pageInProperty(siteUrl: string, pageUrl: string): boolean {
  try {
    const page = new URL(pageUrl);
    if (!/^https?:$/.test(page.protocol) || page.username || page.password) return false;
    if (siteUrl.startsWith("sc-domain:")) {
      const domain = siteUrl.slice(10).toLowerCase();
      return !!domain && (page.hostname === domain || page.hostname.endsWith(`.${domain}`));
    }
    const property = new URL(siteUrl);
    return /^https?:$/.test(property.protocol) && !property.username && !property.password
      && property.origin === page.origin && page.href.startsWith(property.href);
  } catch { return false; }
}

export function summarizeInspection(response: InspectionResponse, observedAt = new Date()) {
  const raw = response.inspectionResult?.indexStatusResult;
  if (!raw) throw new InspectionError(502, "Google did not return indexing data for this page. Try again later.");
  const text = (value?: string) => typeof value === "string" && value.trim() ? value.trim() : null;
  const timestamp = text(raw.lastCrawlTime);
  const crawlMs = timestamp ? Date.parse(timestamp) : NaN;
  const validDate = Number.isFinite(crawlMs) && crawlMs <= observedAt.getTime();
  const daysSinceLastCrawl = validDate ? Math.floor((observedAt.getTime() - crawlMs) / 86_400_000) : null;
  const crawlAttention = daysSinceLastCrawl === null ? "unavailable" : daysSinceLastCrawl >= 190 ? "long_gap"
    : daysSinceLastCrawl >= 130 ? "extended_gap" : daysSinceLastCrawl >= 90 ? "review" : "recent";
  const nextSteps: string[] = [];
  if (raw.robotsTxtState === "DISALLOWED") nextSteps.push("Check whether this page should be available to Google before changing its robots.txt rules.");
  if (raw.indexingState === "BLOCKED_BY_META_TAG" || raw.indexingState === "BLOCKED_BY_HTTP_HEADER") nextSteps.push("Review the reported noindex directive. Remove it only if this page belongs in search results.");
  if (raw.pageFetchState && raw.pageFetchState !== "SUCCESSFUL" && raw.pageFetchState !== "PAGE_FETCH_STATE_UNSPECIFIED") nextSteps.push("Investigate Google's reported fetch problem before rewriting the content.");
  if (raw.googleCanonical && raw.userCanonical && raw.googleCanonical !== raw.userCanonical) nextSteps.push("Check whether Google's selected canonical is the intended version of this page.");
  if (raw.verdict !== "PASS") nextSteps.push("Review Google's coverage state. A successful crawl or indexing permission does not prove this URL is indexed.");
  if (daysSinceLastCrawl !== null && daysSinceLastCrawl >= 90) nextSteps.push("If this page matters to the business, review its distinct value, relevant internal links and canonical sitemap inclusion. Update substance before changing dates.");
  if (!nextSteps.length) nextSteps.push("Use the page's query evidence and business value to decide what to improve next. Recent crawling alone does not prove search or AI visibility.");
  return {
    observedAt: observedAt.toISOString(),
    lastCrawlTime: validDate ? new Date(crawlMs).toISOString() : null,
    daysSinceLastCrawl, crawlAttention,
    verdict: text(raw.verdict), coverageState: text(raw.coverageState),
    robotsTxtState: text(raw.robotsTxtState), indexingState: text(raw.indexingState),
    pageFetchState: text(raw.pageFetchState), googleCanonical: text(raw.googleCanonical), userCanonical: text(raw.userCanonical),
    nextSteps,
  };
}

export type InspectionReport = ReturnType<typeof summarizeInspection> & { siteUrl: string; pageUrl: string };

// Short-lived, tenant-specific cache. Permissions are checked before every read.
// This is an on-demand check, not a persistent history or site-wide monitor.
export function createInspectionService(now: () => Date = () => new Date()) {
  const cache = new Map<string, { expires: number; report: InspectionReport }>();
  const budgets = new Map<string, { day: string; count: number; minute: number; minuteCount: number }>();
  const pending = new Map<string, Promise<InspectionReport>>();
  return async function inspect(args: {
    userId: string; siteUrl: string; pageUrl: string;
    listSites: () => Promise<Array<{ siteUrl: string; permissionLevel: string }>>;
    fetchInspection: () => Promise<InspectionResponse>;
  }): Promise<InspectionReport> {
    if (!pageInProperty(args.siteUrl, args.pageUrl)) throw new InspectionError(400, "This page is outside the selected Search Console property.");
    const sites = await args.listSites();
    if (!sites.some(site => site.siteUrl === args.siteUrl && site.permissionLevel !== "siteUnverifiedUser")) {
      throw new InspectionError(403, "That Search Console property is not available to this Google account.");
    }
    const current = now();
    const key = JSON.stringify([args.userId, args.siteUrl, args.pageUrl]);
    for (const [entryKey, entry] of cache) if (entry.expires <= current.getTime()) cache.delete(entryKey);
    const cached = cache.get(key);
    if (cached) return cached.report;
    const inFlight = pending.get(key);
    if (inFlight) return inFlight;
    // Conservative per-instance allowance below Google's property quota.
    // Google remains the authority across autoscale instances and other tools.
    const day = current.toISOString().slice(0, 10);
    const minute = Math.floor(current.getTime() / 60_000);
    for (const [property, budget] of budgets) if (budget.day !== day) budgets.delete(property);
    const budget = budgets.get(args.siteUrl) ?? { day, count: 0, minute, minuteCount: 0 };
    if (budget.minute !== minute) { budget.minute = minute; budget.minuteCount = 0; }
    if (budget.count >= 1000 || budget.minuteCount >= 60 || pending.size >= 100) throw new InspectionError(429, "Inspection allowance reached. Try again later; other checks remain available.");
    if (budgets.size >= 1000 && !budgets.has(args.siteUrl)) throw new InspectionError(429, "Inspection is busy. Try again later.");
    budget.count++; budget.minuteCount++;
    budgets.set(args.siteUrl, budget);
    const request = (async () => {
      const report = { ...summarizeInspection(await args.fetchInspection(), now()), siteUrl: args.siteUrl, pageUrl: args.pageUrl };
      if (cache.size >= 1000) cache.delete(cache.keys().next().value!);
      cache.set(key, { expires: now().getTime() + 3_600_000, report });
      return report;
    })();
    pending.set(key, request);
    try { return await request; } finally { pending.delete(key); }
  };
}

export async function fetchGoogleInspection(accessToken: string, siteUrl: string, pageUrl: string): Promise<InspectionResponse> {
  const response = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inspectionUrl: pageUrl, siteUrl, languageCode: "en-US" }), signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    await response.body?.cancel();
    if (response.status === 429) throw new InspectionError(429, "Google's inspection quota has been reached. Try again later.");
    if (response.status === 401) throw new InspectionError(409, "Reconnect Google to restore Search Console access.");
    if (response.status === 403) throw new InspectionError(403, "Google could not authorize this inspection. Check property access and API availability.");
    throw new InspectionError(502, "Google could not return this inspection. Try again later.");
  }
  return await response.json() as InspectionResponse;
}
