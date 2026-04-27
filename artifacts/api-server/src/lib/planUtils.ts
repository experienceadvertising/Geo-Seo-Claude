import { clerkClient } from "@clerk/express";

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
    const user = await clerkClient.users.getUser(userId);
    const plan = (user.publicMetadata as any)?.plan as string | undefined;
    if (plan === "agency") return "agency";
    if (plan === "pro") return "pro";
    return "free";
  } catch {
    return "free";
  }
}

export const PLAN_LIMITS = {
  free: {
    simulationPrompts: 3,
    simulationEngines: ["chatgpt"] as string[],
    auditHistoryDays: 30,
    competitorTracking: false,
    fixGenerator: false,
    sitemapScanner: false,
    sentimentAnalysis: false,
  },
  pro: {
    simulationPrompts: 25,
    simulationEngines: ["chatgpt", "claude", "gemini", "perplexity"] as string[],
    auditHistoryDays: 365,
    competitorTracking: true,
    fixGenerator: true,
    sitemapScanner: false,
    sentimentAnalysis: true,
  },
  agency: {
    simulationPrompts: 25,
    simulationEngines: ["chatgpt", "claude", "gemini", "perplexity"] as string[],
    auditHistoryDays: 730,
    competitorTracking: true,
    fixGenerator: true,
    sitemapScanner: true,
    sentimentAnalysis: true,
  },
} satisfies Record<Plan, object>;
