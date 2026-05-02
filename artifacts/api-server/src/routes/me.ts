import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { getUserPlan, PLAN_LIMITS } from "../lib/planUtils";
import { readRateLimiter } from "../middlewares/rateLimiters";
import { getMonthlyUsage } from "../lib/usageLimits";

const router: IRouter = Router();

// NOTE: this router is mounted at /api in routes/index.ts, so the final path
// is /api/me. Don't repeat /api here or it becomes /api/api/me.
router.get("/me", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  try {
    const plan = await getUserPlan(req.userId!);
    const usage = await getMonthlyUsage(req.userId!);
    const limits = PLAN_LIMITS[plan];
    res.json({
      userId: req.userId,
      plan,
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
