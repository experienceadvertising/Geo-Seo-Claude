// Pure plan definitions: tiers, ranks, trial length, and per-plan limits.
// No database or framework imports — safe to load from unit tests and
// anywhere else that must not open a connection pool.
export type Plan = "free" | "starter" | "pro" | "agency";

const PLAN_RANK: Record<Plan, number> = { free: 0, starter: 1, pro: 2, agency: 3 };

export function planRank(plan: Plan): number {
  return PLAN_RANK[plan] ?? 0;
}

export function planAtLeast(userPlan: Plan, required: Plan): boolean {
  return planRank(userPlan) >= planRank(required);
}

// Every account's first month is completely free with every feature
// unlocked — trial users get the top-tier entitlements below.
export const TRIAL_LENGTH_DAYS = 30;
export const TRIAL_PLAN: Plan = "agency";

export function normalizePlan(plan: string | null | undefined): Plan {
  if (plan === "agency") return "agency";
  if (plan === "pro") return "pro";
  if (plan === "starter") return "starter";
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
    seoKeywordTargets: 0,
    manualRankRefreshes: 0,
  },
  // Starter is deliberately an activation tier, not a discounted Pro plan.
  // It offers more room to implement the guided SEO + GEO workflow, while
  // keeping provider-backed reporting and recurring collection in Pro where
  // we can support it responsibly.
  starter: {
    simulationPrompts: 3,
    simulationEngines: ["chatgpt"] as string[],
    monthlyAudits: 15,
    monthlySimulations: 5,
    auditHistoryDays: 90,
    monitoredSites: 0,
    dailyMonitoredSites: 0,
    competitorTracking: false,
    fixGenerator: true,
    sitemapScanner: false,
    sentimentAnalysis: false,
    seoKeywordTargets: 0,
    manualRankRefreshes: 0,
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
    seoKeywordTargets: 25,
    manualRankRefreshes: 10,
  },
  agency: {
    // Agency includes everything in Pro (its Stripe description promises
    // exactly that), so per-simulation depth must never trail Pro's.
    // A regression test asserts this monotonicity.
    simulationPrompts: 25,
    simulationEngines: ["chatgpt", "claude", "gemini", "perplexity"] as string[],
    monthlyAudits: 150,
    monthlySimulations: 40,
    auditHistoryDays: 730,
    // Up to ten monitored sites — one per active client in the current
    // workspace model. Daily monitoring is capped separately for cost control.
    monitoredSites: 10,
    dailyMonitoredSites: 2,
    competitorTracking: true,
    fixGenerator: true,
    sitemapScanner: true,
    sentimentAnalysis: true,
    seoKeywordTargets: 100,
    manualRankRefreshes: 50,
  },
} satisfies Record<Plan, object>;
