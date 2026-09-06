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

/** Use the same selection policy as the action plan and emails, excluding each pick. */
export function nextThreeImprovements<T extends Recommendation>(
  recommendations: T[] | undefined,
  completed: ReadonlySet<string>,
  status: "loading" | "error" | "ready",
) {
  const first = nextImprovement(recommendations, completed, status);
  const tasks: T[] = [];
  const excluded = new Set(completed);
  let task = first.task;
  while (task?.id && tasks.length < 3) {
    tasks.push(task);
    excluded.add(task.id);
    task = nextImprovement(recommendations, excluded, status).task;
  }
  return { state: first.state, tasks };
}
