import type { Request, Response } from "express";
import { verifySchedulerRequest } from "./schedulerRequestAuth.ts";
import { logger } from "./logger.ts";

export async function schedulerHttp(req: Request, res: Response): Promise<void> {
  res.setHeader("Cache-Control", "no-store");
  const body = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
  const timestamp = req.get("x-scheduler-timestamp");
  const signature = req.get("x-scheduler-signature");
  if (!verifySchedulerRequest(process.env.SCHEDULER_SECRET, timestamp, signature, body)) {
    res.status(401).json({ error: "Unauthorized" }); return;
  }
  let operation: unknown;
  try {
    const parsed = JSON.parse(body);
    if (Object.keys(parsed).length !== 1) throw new Error("Invalid request");
    operation = parsed.operation;
  } catch { res.status(400).json({ error: "Invalid request" }); return; }
  if (operation === "probe") {
    res.json({ status: "ready", protocol: 1 }); return;
  }
  if (operation !== "run-due") { res.status(400).json({ error: "Invalid operation" }); return; }
  if (process.env.SCHEDULER_MODE !== "cloudflare" || process.env.SCHEDULED_WORKER_ENABLED !== "true") {
    res.status(503).json({ error: "Scheduler disabled" }); return;
  }
  try {
    const { runCloudflareSchedulerStep } = await import("./cloudflareScheduler");
    res.json(await runCloudflareSchedulerStep());
  } catch {
    logger.error({ component: "cloudflare-scheduler" }, "Scheduled work failed or requires review; no automatic replay");
    res.status(503).json({ error: "Scheduler requires review" });
  }
}
