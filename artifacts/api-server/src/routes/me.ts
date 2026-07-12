import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { getPlanInfo, PLAN_LIMITS } from "../lib/planUtils";
import { readRateLimiter } from "../middlewares/rateLimiters";
import { getMonthlyUsage } from "../lib/usageLimits";

const router: IRouter = Router();

// NOTE: this router is mounted at /api in routes/index.ts, so the final path
// is /api/me. Don't repeat /api here or it becomes /api/api/me.
router.get("/me", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  try {
    const { storedPlan, effectivePlan, trialActive, trialEndsAt } = await getPlanInfo(req.userId!);
    const usage = await getMonthlyUsage(req.userId!);
    // Gates and caps reflect the effective plan so the whole UI unlocks
    // during the free first month; storedPlan is what billing CTAs key off.
    const plan = effectivePlan;
    const limits = PLAN_LIMITS[plan];
    res.json({
      userId: req.userId,
      plan,
      storedPlan,
      trial: trialActive ? { active: true, endsAt: trialEndsAt.toISOString() } : { active: false },
      usage: {
        yearMonth: usage.yearMonth,
        audits: { used: usage.audits, cap: limits.monthlyAudits, remaining: Math.max(0, limits.monthlyAudits - usage.audits) },
        simulations: { used: usage.simulations, cap: limits.monthlySimulations, remaining: Math.max(0, limits.monthlySimulations - usage.simulations) },
      },
      limits: {
        simulationPrompts: limits.simulationPrompts,
        simulationEngines: limits.simulationEngines,
        fixGenerator: limits.fixGenerator,
        sentimentAnalysis: limits.sentimentAnalysis,
      },
    });
  } catch {
    res.status(500).json({ error: "Failed to load user info" });
  }
});

export default router;
