/** Page findings must not disappear when a different page is improved. */
export function sharedRecommendation(id: string): boolean {
  // Crawl and firewall findings can be path-specific even when their rules
  // live in a shared file, so they remain page-scoped.
  return id.startsWith("offsite:") || id === "llms-txt";
}

export function recommendationPageKey(raw: string): string {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid page URL");
  url.hash = "";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}

export function progressApplies(row: { recommendationId: string; pageUrl?: string | null }, pageUrl?: string): boolean {
  if (sharedRecommendation(row.recommendationId)) return !row.pageUrl;
  if (!row.pageUrl || !pageUrl) return false;
  try { return recommendationPageKey(row.pageUrl) === recommendationPageKey(pageUrl); } catch { return false; }
}
