export function visibleRecommendations<T extends { id?: string }>(
  recommendations: T[], completedIds: Set<string>, filter: "open" | "all" | "done", expanded: boolean,
): T[] {
  const matches = recommendations.filter((recommendation) => {
    const done = !!recommendation.id && completedIds.has(recommendation.id);
    return filter === "all" || (filter === "done" ? done : !done);
  });
  return expanded ? matches : matches.slice(0, 3);
}
