import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { normalizePlan, planRank, TRIAL_PLAN, trialEndFor, type Plan } from "./planLimits";

// Re-export the pure plan definitions so existing imports keep working.
export * from "./planLimits";

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
