export type WorkerJob = "ranks" | "monitoring" | "welcome" | "trial" | "simulation-followup" | "weekly-digest" | "monthly-report" | "weekly-insights";
export type WorkerSlot = { job: WorkerJob; slot: string };

/** Hourly invocation with daily catch-up windows, all interpreted in UTC. */
export function workerPlan(now: Date): WorkerSlot[] {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid worker time");
  const day = now.toISOString().slice(0, 10);
  const hour = now.getUTCHours();
  const result: WorkerSlot[] = [{ job: "ranks", slot: now.toISOString().slice(0, 13) }];
  const daily = (job: WorkerJob, after: number) => { if (hour >= after) result.push({ job, slot: day }); };
  daily("monitoring", 7);
  daily("welcome", 9);
  daily("trial", 10);
  daily("simulation-followup", 11);
  if (now.getUTCDay() === 1) daily("weekly-digest", 8);
  if (now.getUTCDate() === 1 && hour >= 8) result.push({ job: "monthly-report", slot: day.slice(0, 7) });
  if (now.getUTCDay() === 4) daily("weekly-insights", 9);
  return result;
}

export function workerEnabled(env: Record<string, string | undefined>): boolean {
  return env.SCHEDULED_WORKER_ENABLED === "true" && env.SCHEDULER_MODE === "external";
}

export interface SlotStore {
  claim(job: WorkerJob, slot: string): Promise<boolean>;
  finish(job: WorkerJob, slot: string, status: "completed" | "failed"): Promise<void>;
}

/** Claim before side effects. Uncertain/failed slots need review, not blind retry. */
export async function runWorkerSlot(store: SlotStore, item: WorkerSlot, run: () => Promise<void>) {
  if (!await store.claim(item.job, item.slot)) return "skipped";
  try {
    await run();
    await store.finish(item.job, item.slot, "completed");
    return "completed";
  } catch {
    await store.finish(item.job, item.slot, "failed");
    throw new Error(`Scheduled job ${item.job} failed; inspect private logs before retrying`);
  }
}
