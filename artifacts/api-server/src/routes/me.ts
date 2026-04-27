import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";
import { getUserPlan } from "../lib/planUtils";
import { readRateLimiter } from "../middlewares/rateLimiters";

const router: IRouter = Router();

router.get("/api/me", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  try {
    const plan = await getUserPlan(req.userId!);
    res.json({ userId: req.userId, plan });
  } catch {
    res.status(500).json({ error: "Failed to load user info" });
  }
});

export default router;
