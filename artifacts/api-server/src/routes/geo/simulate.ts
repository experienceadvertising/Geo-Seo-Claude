import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, promptSimulationsTable, auditsTable } from "@workspace/db";
import { runPromptSimulation, generatePromptsForBrand, type EngineId, type PromptGenerationContext } from "../../lib/promptSimulator";
import { requireAuth } from "../../middlewares/auth";
import { simulateRateLimiter, readRateLimiter } from "../../middlewares/rateLimiters";
import { getUserPlan, PLAN_LIMITS } from "../../lib/planUtils";

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
