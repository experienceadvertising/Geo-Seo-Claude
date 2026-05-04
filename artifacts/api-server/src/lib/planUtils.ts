import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export type Plan = "free" | "pro" | "agency";

const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, agency: 2 };

export function planRank(plan: Plan): number {
  return PLAN_RANK[plan] ?? 0;
}

export function planAtLeast(userPlan: Plan, required: Plan): boolean {
  return planRank(userPlan) >= planRank(required);
}

export async function getUserPlan(userId: string): Promise<Plan> {
  try {
    const [user] = await db
      .select({ plan: usersTable.plan })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    const plan = user?.plan;
    if (plan === "agency") return "agency";
    if (plan === "pro") return "pro";
    return "free";
  } catch {
    return "free";
  }
}

export const PLAN_LIMITS = {
  free: {
    // Per-simulation caps
    simulationPrompts: 3,
    simulationEngines: ["chatgpt"] as string[],
    // Monthly volume caps. Keep free generous enough to prove value (one
    // full audit + simulation gets users to the "aha" moment) but bounded
    // so abuse can't burn through token budget. Estimated worst-case cost
    // per free user/month ≈ $0.30.
    monthlyAudits: 5,
    monthlySimulations: 2,
    auditHistoryDays: 30,
    competitorTracking: false,
    fixGenerator: false,
    sitemapScanner: false,
    sentimentAnalysis: false,
  },
  pro: {
    simulationPrompts: 25,
    simulationEngines: ["chatgpt", "claude", "gemini", "perplexity"] as string[],
    // At $49/mo Pro, worst-case cost at these caps ≈ $35-45 → 29-41% gross
    // margin floor. Typical use (~10 audits, 8 simulations) ≈ $7 cost →
    // 91% gross margin. Caps protect the worst case, typical use is very
    // profitable.
    monthlyAudits: 100,
    monthlySimulations: 30,
    auditHistoryDays: 365,
    competitorTracking: true,
    fixGenerator: true,
    sitemapScanner: false,
    sentimentAnalysis: true,
  },
  agency: {
    simulationPrompts: 25,
    simulationEngines: ["chatgpt", "claude", "gemini", "perplexity"] as string[],
    // At $299/mo Agency, worst-case cost ≈ $230 (margin floor 23%) and
    // typical agency use (~50 audits, 30 simulations across clients) ≈
    // $50 cost → 83% margin. Caps high enough that legitimate agencies
    // never hit them.
    monthlyAudits: 500,
    monthlySimulations: 150,
    auditHistoryDays: 730,
    competitorTracking: true,
    fixGenerator: true,
    sitemapScanner: true,
    sentimentAnalysis: true,
  },
} satisfies Record<Plan, object>;
