import { pgTable, serial, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

export const recommendationProgressTable = pgTable("recommendation_progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  domain: text("domain").notNull(),
  recommendationId: text("recommendation_id").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
}, (table) => ({
  userDomainRecommendationUnique: uniqueIndex("recommendation_progress_user_domain_rec_uq")
    .on(table.userId, table.domain, table.recommendationId),
  userDomainIdx: index("recommendation_progress_user_domain_idx").on(table.userId, table.domain),
}));

export type RecommendationProgress = typeof recommendationProgressTable.$inferSelect;
