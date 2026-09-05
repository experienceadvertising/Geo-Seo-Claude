type Recommendation = { id?: string; priority?: string; title: string; detail: string };

/** Missing progress is unknown, not proof that the user finished their work. */
export function nextImprovement<T extends Recommendation>(
  recommendations: T[] | undefined,
  completed: ReadonlySet<string>,
  status: "loading" | "error" | "ready",
): { state: "loading" | "error" | "empty" | "complete" | "task"; task?: T } {
  if (status !== "ready") return { state: status };
  if (!recommendations?.length) return { state: "empty" };
  const open = recommendations.filter((item) => !item.id || !completed.has(item.id));
  const priority: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const task = [...open].sort((a, b) => (priority[a.priority ?? ""] ?? 4) - (priority[b.priority ?? ""] ?? 4))[0];
  return task ? { state: "task", task } : { state: "complete" };
}

export function improvementLink(auditId: number, recommendationId?: string): string {
  return `/results/${auditId}${recommendationId ? `?task=${encodeURIComponent(recommendationId)}` : ""}#recommendations`;
}
