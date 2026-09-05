/** Pure parsing and budget policy. Never log provider bodies or searched terms. */
export const INSIGHT_CACHE_MS = 30 * 86400000;
export const insightLimit = (plan: string) => plan === "agency" ? 100 : plan === "pro" ? 25 : 0;
export const keywordKey = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
export function freshInsight(value: any, now = Date.now()): boolean {
  const time = Date.parse(value?.collectedAt);
  return Number.isFinite(time) && time <= now && now - time < INSIGHT_CACHE_MS;
}
export function selectInsightTargets<T extends { id: number; locationCode: number; languageCode: string; insights?: unknown }>(targets: T[], usedIds: Set<number>, plan: string, now = Date.now()): T[] {
  const remaining = Math.max(0, insightLimit(plan) - usedIds.size);
  const groups = new Set<string>();
  return targets.filter(target => {
    if (usedIds.has(target.id) || freshInsight(target.insights, now)) return false;
    const key = `${target.locationCode}:${target.languageCode}`;
    if (!groups.has(key) && groups.size >= 4) return false;
    groups.add(key);
    return true;
  }).slice(0, remaining);
}
const numberOrNull = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
export function parseKeywordInsight(item: any, collectedAt = new Date().toISOString()) {
  const info = item?.keyword_info;
  const allowed = ["informational", "navigational", "commercial", "transactional"];
  const monthly = Array.isArray(info?.monthly_searches) ? info.monthly_searches : [];
  return {
    source: "DataForSEO Keyword Database", collectedAt,
    sourceUpdatedAt: typeof info?.last_updated_time === "string" ? info.last_updated_time.slice(0, 40) : null,
    intentUpdatedAt: typeof item?.search_intent_info?.last_updated_time === "string" ? item.search_intent_info.last_updated_time.slice(0, 40) : null,
    searchVolume: numberOrNull(info?.search_volume),
    intent: allowed.includes(item?.search_intent_info?.main_intent) ? item.search_intent_info.main_intent as string : null,
    monthlySearches: monthly.filter((row: any) => Number.isInteger(row?.year) && row.year >= 2000 && row.year <= 2100 && Number.isInteger(row?.month) && row.month >= 1 && row.month <= 12)
      .map((row: any) => ({ year: row.year as number, month: row.month as number, volume: numberOrNull(row.search_volume) }))
      .sort((a: any, b: any) => a.year - b.year || a.month - b.month).slice(-12),
  };
}

/** Keep only safe, bounded organic results. These are search competitors, not
 * necessarily businesses selling the same product. */
export function competitorContext(items: any[], ownHost: string, ownPosition: number | null) {
  const seen = new Set<string>();
  return items.flatMap((item: any) => {
    if (item?.type !== "organic") return [];
    try {
      const url = new URL(item.url);
      const host = url.hostname.replace(/^www\./, "");
      const position = numberOrNull(item.rank_absolute ?? item.rank_group);
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || !position || host === ownHost || seen.has(host) || (ownPosition !== null && position >= ownPosition)) return [];
      seen.add(host);
      return [{ url: url.href.slice(0, 2000), domain: host, position, title: typeof item.title === "string" ? item.title.slice(0, 200) : host }];
    } catch { return []; }
  }).sort((a, b) => a.position - b.position).slice(0, 5);
}
