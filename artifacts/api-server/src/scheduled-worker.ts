import { workerEnabled, workerPlan, runWorkerSlot } from "./lib/workerPlan";

async function main() {
  const plan = workerPlan(new Date());
  if (!workerEnabled(process.env)) {
    console.log(JSON.stringify({ mode: "dry-run", jobs: plan, message: "No database access, provider calls or emails. Both worker activation settings are required." }));
    return;
  }
  // Import side-effect-capable modules only after the activation gate.
  const { pool } = await import("@workspace/db");
  const lockClient = await pool.connect();
  try {
    const lock = await lockClient.query("SELECT pg_try_advisory_lock($1) AS acquired", [1947026073]);
    if (!lock.rows[0]?.acquired) { console.log("Scheduled worker already running; skipped"); return; }
    const { runExternalScheduledJob } = await import("./lib/emailScheduler");
    const { isDataForSeoConfigured } = await import("./lib/dataforseoRankTracker");
    let failed = false;
    for (const item of plan) {
      if (item.job === "ranks" && !isDataForSeoConfigured()) {
        console.error(JSON.stringify({ job: item.job, status: "missing-provider-config" }));
        failed = true; continue;
      }
      if (!["ranks", "monitoring"].includes(item.job) && !process.env.POSTMARK_API_TOKEN) {
        console.error(JSON.stringify({ job: item.job, status: "missing-email-config" }));
        failed = true; continue;
      }
      try {
        const status = await runWorkerSlot({
          claim: async (job, slot) => {
            const result = await pool.query("INSERT INTO scheduled_job_runs (job, slot, status) VALUES ($1, $2, 'running') ON CONFLICT (job, slot) DO NOTHING RETURNING job", [job, slot]);
            return result.rows.length === 1;
          },
          finish: async (job, slot, status) => {
            await pool.query("UPDATE scheduled_job_runs SET status = $3, finished_at = now() WHERE job = $1 AND slot = $2", [job, slot, status]);
          },
        }, item, () => runExternalScheduledJob(item.job));
        console.log(JSON.stringify({ job: item.job, slot: item.slot, status }));
      } catch {
        failed = true;
        console.error(JSON.stringify({ job: item.job, slot: item.slot, status: "failed-review-required" }));
      }
    }
    if (failed) process.exitCode = 1;
  } finally {
    await lockClient.query("SELECT pg_advisory_unlock($1)", [1947026073]).catch(() => undefined);
    lockClient.release();
    await pool.end();
  }
}

main().catch(() => {
  console.error("Scheduled worker could not initialize. Check configuration and migration privately.");
  process.exitCode = 1;
});
