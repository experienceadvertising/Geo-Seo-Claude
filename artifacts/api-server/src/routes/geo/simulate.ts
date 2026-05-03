import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, promptSimulationsTable, auditsTable } from "@workspace/db";
import { runPromptSimulation, generatePromptsForBrand, type EngineId, type PromptGenerationContext } from "../../lib/promptSimulator";
import { requireAuth } from "../../middlewares/auth";
import { simulateRateLimiter, readRateLimiter } from "../../middlewares/rateLimiters";
import { getUserPlan, PLAN_LIMITS } from "../../lib/planUtils";
import { consumeQuota, refundQuota, currentYearMonth, markApproachingNotified } from "../../lib/usageLimits";
import { sql } from "drizzle-orm";
import { db as appDb, usersTable } from "@workspace/db";
import { EmailService } from "../../lib/emailService";

const router: IRouter = Router();

const VALID_ENGINES: EngineId[] = ["chatgpt", "claude", "gemini", "perplexity"];

router.post("/geo/prompts/suggest", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const brandName = typeof req.body?.brandName === "string" ? req.body.brandName.trim().slice(0, 120) : "";
  if (!brandName || brandName.length < 2) {
    res.status(400).json({ error: "brandName is required (2-120 chars)" });
    return;
  }
  const context: PromptGenerationContext = {
    description: typeof req.body?.description === "string" ? req.body.description.slice(0, 500) : null,
    title: typeof req.body?.title === "string" ? req.body.title.slice(0, 200) : null,
    aiInsights: typeof req.body?.aiInsights === "string" ? req.body.aiInsights.slice(0, 800) : null,
  };
  try {
    const prompts = await generatePromptsForBrand(brandName, context);
    res.json({ prompts });
  } catch (err) {
    req.log.error({ err }, "Prompt suggestion failed");
    res.status(500).json({ error: "Failed to generate prompt suggestions" });
  }
});

router.post("/geo/simulate", requireAuth, simulateRateLimiter, async (req, res): Promise<void> => {
  const body = req.body ?? {};
  const domain = typeof body.domain === "string" ? body.domain.trim().toLowerCase().slice(0, 253) : "";
  const brandName = typeof body.brandName === "string" ? body.brandName.trim().slice(0, 120) : "";
  const auditId = typeof body.auditId === "number" && Number.isInteger(body.auditId) ? body.auditId : null;

  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    res.status(400).json({ error: "Valid domain is required" });
    return;
  }
  if (!brandName || brandName.length < 2) {
    res.status(400).json({ error: "brandName is required (2-120 chars)" });
    return;
  }
  if (!Array.isArray(body.prompts) || body.prompts.length === 0) {
    res.status(400).json({ error: "prompts[] is required" });
    return;
  }

  // Enforce plan limits
  const plan = await getUserPlan(req.userId!);
  const limits = PLAN_LIMITS[plan];

  if (body.prompts.length > limits.simulationPrompts) {
    res.status(403).json({
      error: `Your ${plan} plan allows a maximum of ${limits.simulationPrompts} prompt${limits.simulationPrompts === 1 ? "" : "s"} per simulation.`,
      plan,
      limit: limits.simulationPrompts,
      upgradeRequired: true,
    });
    return;
  }

  // ALL deterministic 4xx validations MUST run before consumeQuota — once
  // we reserve a slot, an early return without refund would burn the
  // user's monthly quota for an invalid request that never ran.

  // If linked to an audit, verify it belongs to this user
  if (auditId !== null) {
    const [audit] = await db.select({ id: auditsTable.id }).from(auditsTable)
      .where(and(eq(auditsTable.id, auditId), eq(auditsTable.userId, req.userId!)));
    if (!audit) {
      res.status(403).json({ error: "Audit not found or not yours" });
      return;
    }
  }

  const cleanPrompts: string[] = body.prompts
    .map((p: unknown) => (typeof p === "string" ? p.trim() : ""))
    .filter((p: string) => p.length >= 5 && p.length <= 300)
    .slice(0, limits.simulationPrompts);

  if (cleanPrompts.length === 0) {
    res.status(400).json({ error: "No valid prompts (5-300 chars each)" });
    return;
  }

  // Filter engines by plan
  const allowedEngines = limits.simulationEngines as EngineId[];
  const requestedEngines = Array.isArray(body.engines)
    ? body.engines.filter((e: unknown): e is EngineId => typeof e === "string" && (VALID_ENGINES as string[]).includes(e))
    : undefined;
  const selectedEngines = requestedEngines
    ? requestedEngines.filter((e) => allowedEngines.includes(e))
    : allowedEngines;

  if (selectedEngines.length === 0) {
    res.status(403).json({
      error: `Your ${plan} plan only allows these engines: ${allowedEngines.join(", ")}.`,
      plan,
      allowedEngines,
      upgradeRequired: true,
    });
    return;
  }

  // All validations passed — NOW consume quota. Pin month at request start
  // for UTC-midnight safety. Refund happens in the catch block below if
  // the LLM fan-out itself fails.
  const ym = currentYearMonth();
  const monthQuota = await consumeQuota(req.userId!, plan, "simulations", ym);
  if (!monthQuota.allowed) {
    if (monthQuota.firstDenial) {
      appDb
        .select({
          email: usersTable.email,
          firstName: usersTable.firstName,
          unsubscribeToken: usersTable.unsubscribeToken,
          emailOptOut: usersTable.emailOptOut,
        })
        .from(usersTable)
        .where(sql`id = ${req.userId!}`)
        .then(([u]) => {
          if (u?.email && !u.emailOptOut) {
            const baseUrl = process.env.FRONTEND_URL || "https://aeoimprovement.com";
            const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${u.unsubscribeToken}`;
            return EmailService.sendLimitReached(u.email, u.firstName || "", "simulations", monthQuota.cap, unsubscribeUrl);
          }
        })
        .catch((err) => req.log.error({ err, userId: req.userId }, "limit-reached email failed"));
    }
    res.status(429).json({
      error: `You've used all ${monthQuota.cap} ${plan === "free" ? "free " : ""}prompt simulations this month. ${plan === "free" ? "Upgrade to Pro for 30 simulations/mo." : "Your quota refills next month."}`,
      upgradeRequired: plan === "free",
      limitType: "simulations",
      used: monthQuota.used,
      cap: monthQuota.cap,
    });
    return;
  }

  // Approaching-limit nudge: free user just consumed second-to-last sim
  // of the month. Atomic flag-claim guarantees one email per (user, kind,
  // month). Skipped when cap < 4 (free's sim cap is 2, so this branch
  // is effectively dormant for free sims today — they go straight to
  // limit-reached. Pro/Agency caps are larger but we only nudge free.)
  if (plan === "free" && monthQuota.cap >= 4 && monthQuota.used + 1 === monthQuota.cap - 1) {
    (async () => {
      try {
        const claimed = await markApproachingNotified(req.userId!, "simulations", ym);
        if (!claimed) return;
        const [u] = await appDb
          .select({
            email: usersTable.email,
            firstName: usersTable.firstName,
            unsubscribeToken: usersTable.unsubscribeToken,
            emailOptOut: usersTable.emailOptOut,
          })
          .from(usersTable)
          .where(sql`id = ${req.userId!}`);
        if (!u?.email || u.emailOptOut) return;
        const baseUrl = process.env.FRONTEND_URL || "https://aeoimprovement.com";
        const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${u.unsubscribeToken}`;
        await EmailService.sendApproachingLimit(
          u.email, u.firstName || "", "simulations", monthQuota.used + 1, monthQuota.cap, unsubscribeUrl,
        );
      } catch (err) {
        req.log.error({ err, userId: req.userId }, "approaching-limit email failed");
      }
    })();
  }

  req.log.info({ domain, promptCount: cleanPrompts.length, engines: selectedEngines, plan, userId: req.userId }, "Starting prompt simulation");

  try {
    const { results, summary } = await runPromptSimulation(
      cleanPrompts,
      brandName,
      domain,
      selectedEngines.length > 0 ? selectedEngines : undefined
    );

    const [saved] = await db.insert(promptSimulationsTable).values({
      userId: req.userId!,
      auditId,
      domain,
      brandName,
      prompts: cleanPrompts,
      results,
      summary,
      status: "complete",
    }).returning();

    // Quota already reserved up-front — nothing to increment here.
    // (See consumeQuota at top of handler; refunded in catch below if we throw.)

    res.json({
      id: saved.id,
      auditId: saved.auditId,
      domain: saved.domain,
      brandName: saved.brandName,
      prompts: cleanPrompts,
      results,
      summary,
      plan,
      createdAt: saved.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Prompt simulation failed");
    // Refund the reservation since we couldn't deliver the simulation.
    refundQuota(req.userId!, "simulations", ym).catch((refundErr) =>
      req.log.error({ err: refundErr, userId: req.userId, ym }, "Failed to refund simulation quota"),
    );
    res.status(500).json({ error: "Simulation failed. Please try again." });
  }
});

router.get("/geo/audits/:auditId/simulation/latest", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const auditId = parseInt(Array.isArray(req.params.auditId) ? req.params.auditId[0] : req.params.auditId, 10);
  if (Number.isNaN(auditId)) {
    res.status(400).json({ error: "Invalid auditId" });
    return;
  }
  const [sim] = await db
    .select()
    .from(promptSimulationsTable)
    .where(and(
      eq(promptSimulationsTable.auditId, auditId),
      eq(promptSimulationsTable.userId, req.userId!),
      eq(promptSimulationsTable.status, "complete"),
    ))
    .orderBy(desc(promptSimulationsTable.id))
    .limit(1);
  if (!sim) {
    res.status(404).json({ error: "No simulation found for this audit" });
    return;
  }
  res.json({
    ...sim,
    createdAt: sim.createdAt.toISOString(),
  });
});

router.get("/geo/simulations/:id", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const [sim] = await db.select().from(promptSimulationsTable).where(
    and(eq(promptSimulationsTable.id, id), eq(promptSimulationsTable.userId, req.userId!))
  );
  if (!sim) {
    res.status(404).json({ error: "Simulation not found" });
    return;
  }
  res.json({
    ...sim,
    createdAt: sim.createdAt.toISOString(),
  });
});

export default router;
