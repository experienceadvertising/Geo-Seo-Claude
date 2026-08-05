export interface SearchConsoleQueryRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}
export type SearchOpportunityBand = "established" | "quick_win" | "growth" | "emerging";

export interface SearchOpportunity extends SearchConsoleQueryRow {
  priorityScore: number;
  band: SearchOpportunityBand;
  recommendedAction: string;
}

function finiteNonNegative(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Merge duplicate query rows from URL variants. Search Console page filters
 * are case-sensitive, and canonical URLs can differ only by a trailing slash.
 */
export function mergeSearchConsoleRows(rows: SearchConsoleQueryRow[]): SearchConsoleQueryRow[] {
  const merged = new Map<string, SearchConsoleQueryRow>();
  for (const raw of rows) {
    const query = raw.query.trim();
    if (!query) continue;
    const clicks = finiteNonNegative(raw.clicks);
    const impressions = finiteNonNegative(raw.impressions);
    const position = finiteNonNegative(raw.position);
    const existing = merged.get(query.toLowerCase());
    if (!existing) {
      merged.set(query.toLowerCase(), {
        query,
        page: raw.page,
        clicks,
        impressions,
        ctr: impressions > 0 ? clicks / impressions : 0,
        position,
      });
      continue;
    }
    const totalImpressions = existing.impressions + impressions;
    const totalClicks = existing.clicks + clicks;
    existing.position = totalImpressions > 0
      ? ((existing.position * existing.impressions) + (position * impressions)) / totalImpressions
      : Math.min(existing.position, position);
    existing.clicks = totalClicks;
    existing.impressions = totalImpressions;
    existing.ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  }
  return [...merged.values()];
}

function opportunityBand(position: number): SearchOpportunityBand {
  if (position <= 3) return "established";
  if (position <= 10) return "quick_win";
  if (position <= 20) return "growth";
  return "emerging";
}

function actionForBand(band: SearchOpportunityBand): string {
  if (band === "established") return "Protect the ranking and expand only into tightly related fan-out questions.";
  if (band === "quick_win") return "Improve the existing page around relevant fan-out questions and stronger evidence.";
  if (band === "growth") return "Check intent match, strengthen the existing page, and cover the most useful topic gaps.";
  return "Validate that the query matches this page before investing in broader coverage.";
}

/**
 * Rank useful seed queries without pretending to predict ranking lift. The
 * score is only an internal prioritization blend of current impressions and
 * the page's existing average position.
 */
export function rankSearchOpportunities(
  input: SearchConsoleQueryRow[],
  limit = 20,
): SearchOpportunity[] {
  const candidates = mergeSearchConsoleRows(input)
    .filter((row) => row.impressions >= 5 && row.position > 0 && row.position <= 30);
  const maxLogImpressions = Math.max(1, ...candidates.map((row) => Math.log1p(row.impressions)));

  return candidates
    .map((row): SearchOpportunity => {
      const band = opportunityBand(row.position);
      const positionWeight = band === "quick_win" ? 1
        : band === "growth" ? 0.85
        : band === "established" ? 0.7
        : 0.55;
      const demandWeight = Math.log1p(row.impressions) / maxLogImpressions;
      const priorityScore = Math.round((demandWeight * 0.65 + positionWeight * 0.35) * 100);
      return {
        ...row,
        priorityScore,
        band,
        recommendedAction: actionForBand(band),
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore || b.impressions - a.impressions)
    .slice(0, Math.max(1, Math.min(50, limit)));
}

export function buildPageUrlVariants(raw: string): string[] {
  try {
    const url = new URL(raw);
    url.hash = "";
    const variants = new Set<string>([url.toString()]);
    if (url.pathname === "/") {
      variants.add(`${url.protocol}//${url.host}/`);
    } else if (url.pathname.endsWith("/")) {
      const withoutSlash = new URL(url.toString());
      withoutSlash.pathname = withoutSlash.pathname.replace(/\/$/, "");
      variants.add(withoutSlash.toString());
    } else {
      const withSlash = new URL(url.toString());
      withSlash.pathname = `${withSlash.pathname}/`;
      variants.add(withSlash.toString());
    }
    return [...variants];
  } catch {
    return [];
  }
}
