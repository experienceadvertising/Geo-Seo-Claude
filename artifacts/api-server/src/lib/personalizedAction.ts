import { getRecommendation, OFFSITE_ACTIONS } from "@workspace/recommendations";

export function selectPersonalizedAction(recommendations: unknown, completed: ReadonlySet<string>) {
  if (!Array.isArray(recommendations)) return undefined;
  const priority: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const rec = recommendations.filter(r => r && typeof r.id === "string" && getRecommendation(r.id) && !completed.has(r.id) && typeof r.title === "string" && typeof r.detail === "string")
    .sort((a, b) => (priority[a.priority] ?? 4) - (priority[b.priority] ?? 4))[0];
  return rec ? { id: rec.id as string, title: rec.title as string, detail: rec.detail as string } : undefined;
}

export function nextOffsiteAction(completed: ReadonlySet<string>) {
  return OFFSITE_ACTIONS.find(action => !completed.has(action.id));
}

export function sameSite(url: string, domain: string) {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, "") === domain.toLowerCase().replace(/^www\./, ""); } catch { return false; }
}
