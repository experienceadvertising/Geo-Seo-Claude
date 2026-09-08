export function sitePlanPriority(page: { next?: { priority?: string }; rankings: { stale: boolean; position: number | null }[] }): number {
  if (!page.next) return -1;
  const severity = page.next.priority === "critical" ? 100 : page.next.priority === "high" ? 50 : page.next.priority === "medium" ? 20 : 0;
  return severity + (page.rankings.some(r => !r.stale && r.position !== null && r.position >= 4 && r.position <= 20) ? 10 : 0);
}
