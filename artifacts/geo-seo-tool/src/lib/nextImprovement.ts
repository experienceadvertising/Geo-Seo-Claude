import { getRecommendation, selectPersonalizedAction } from "@workspace/recommendations";

type Recommendation = { id?: string; priority?: string; title: string; detail: string };

/** Missing progress is unknown, not proof that the user finished their work. */
export function nextImprovement<T extends Recommendation>(
  recommendations: T[] | undefined,
  completed: ReadonlySet<string>,
  status: "loading" | "error" | "ready",
): { state: "loading" | "error" | "empty" | "complete" | "task"; task?: T } {
  if (status !== "ready") return { state: status };
  if (!recommendations?.length) return { state: "empty" };
  const task = selectPersonalizedAction<T>(recommendations, completed);
  if (task) return { state: "task", task };
  const catalogBacked = recommendations.filter(item => item.id && getRecommendation(item.id));
  return catalogBacked.length && catalogBacked.every(item => completed.has(item.id!)) ? { state: "complete" } : { state: "empty" };
}

export function improvementLink(auditId: number, recommendationId?: string): string {
  return `/actions/${auditId}${recommendationId ? `?task=${encodeURIComponent(recommendationId)}` : ""}#recommendations`;
}
