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

// Every account's first month is completely free with every feature
// unlocked — trial users get the top-tier entitlements below.
export const TRIAL_LENGTH_DAYS = 30;
const TRIAL_PLAN: Plan = "agency";

function normalizePlan(plan: string | null | undefined): Plan {
  if (plan === "agency") return "agency";
  if (plan === "pro") return "pro";
  return "free";
}

/** Trial end for a user row. Accounts created before the trial_ends_at
 * column existed have NULL there — derive signup + 30 days from createdAt
 * so "first month" semantics apply uniformly with no backfill. */
export function trialEndFor(user: { trialEndsAt: Date | null; createdAt: Date; emailVerified?: boolean }): Date {
  if (!user.trialEndsAt && user.emailVerified === false) return new Date(0);
  return (
    user.trialEndsAt ??
    new Date(user.createdAt.getTime() + TRIAL_LENGTH_DAYS * 24 * 60 * 60 * 1000)
  );
}

export interface PlanInfo {
  /** What the user actually pays for (drives billing UI + upgrade CTAs). */
  storedPlan: Plan;
  /** What the user is entitled to right now (drives every feature gate). */
  effectivePlan: Plan;
  trialActive: boolean;
  trialEndsAt: Date;
}

/**
 * Resolve both the paid plan and the entitlement plan for a user. During
 * the free first month the effective plan is the top tier regardless of
 * what they pay, so every gate/quota keyed off the effective plan opens
 * automatically — and closes again the moment the month is up, with no
 * cron needed for enforcement.
 */
export async function getPlanInfo(userId: string): Promise<PlanInfo> {
  const fallbackEnd = new Date(0);
  try {
    const [user] = await db
      .select({
        plan: usersTable.plan,
        trialEndsAt: usersTable.trialEndsAt,
        createdAt: usersTable.createdAt,
        emailVerified: usersTable.emailVerified,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));
    if (!user) {
      return { storedPlan: "free", effectivePlan: "free", trialActive: false, trialEndsAt: fallbackEnd };
    }
    const storedPlan = normalizePlan(user.plan);
    const trialEndsAt = trialEndFor(user);
    const trialActive = trialEndsAt.getTime() > Date.now();
    const effectivePlan = trialActive && planRank(TRIAL_PLAN) > planRank(storedPlan) ? TRIAL_PLAN : storedPlan;
    return { storedPlan, effectivePlan, trialActive, trialEndsAt };
  } catch {
    return { storedPlan: "free", effectivePlan: "free", trialActive: false, trialEndsAt: fallbackEnd };
  }
}

/** Entitlement plan (trial-aware). Every feature gate and quota check in
 * the API goes through this. For billing state, use getStoredPlan. */
export async function getUserPlan(userId: string): Promise<Plan> {
  return (await getPlanInfo(userId)).effectivePlan;
}

/** The plan the user actually pays for — ignores the free-first-month
 * entitlement bump. Use for billing/upgrade surfaces and upsell email
 * decisions, where treating a trial user as "agency" would be wrong. */
export async function getStoredPlan(userId: string): Promise<Plan> {
  return (await getPlanInfo(userId)).storedPlan;
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
    // Continuous monitoring (scheduled re-audits + alerts) is a paid feature.
    monitoredSites: 0,
    dailyMonitoredSites: 0,
    competitorTracking: false,
    fixGenerator: false,
    sitemapScanner: false,
    sentimentAnalysis: false,
  },
  pro: {
    simulationPrompts: 25,
    simulationEngines: ["chatgpt", "claude", "gemini", "perplexity"] as string[],
    // At $79/mo Pro, worst-case cost at these caps ≈ $35-45 → 43-56% gross
    // margin floor. Typical use (~10 audits, 8 simulations) ≈ $7 cost →
    // 91% gross margin. Caps protect the worst case, typical use is very
    // profitable.
    monthlyAudits: 100,
    monthlySimulations: 30,
    auditHistoryDays: 365,
    monitoredSites: 10,
    dailyMonitoredSites: 1,
    competitorTracking: true,
    fixGenerator: true,
    sitemapScanner: false,
    sentimentAnalysis: true,
  },
  agency: {
    // Agency is priced for a deliberate client portfolio, not unlimited
    // experiment volume. Ten prompts still supports focused paid research.
    simulationPrompts: 10,
    simulationEngines: ["chatgpt", "claude", "gemini", "perplexity"] as string[],
    monthlyAudits: 150,
    monthlySimulations: 40,
    auditHistoryDays: 730,
    // One monitored site represents one active client in the current
    // workspace model. Daily monitoring is capped separately for cost control.
    monitoredSites: 10,
    dailyMonitoredSites: 2,
    competitorTracking: true,
    fixGenerator: true,
    sitemapScanner: true,
    sentimentAnalysis: true,
  },
} satisfies Record<Plan, object>;
