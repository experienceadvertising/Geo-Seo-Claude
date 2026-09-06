import { db, recommendationProgressTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { progressApplies } from "@workspace/recommendations";

export async function readRecommendationProgress(userId: string, domain: string, pageUrl?: string) {
  const rows = await db.select().from(recommendationProgressTable).where(and(
    eq(recommendationProgressTable.userId, userId), eq(recommendationProgressTable.domain, domain),
  ));
  return rows.filter(row => progressApplies(row, pageUrl));
}
