import { pool, db, monitoredSitesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { workerPlan, type WorkerJob } from "./workerPlan";
import { runScheduledEmailForUser } from "./emailScheduler";
import { runDueSeoRankSnapshots } from "./seoTrackingScheduler";
import { isDataForSeoConfigured } from "./dataforseoRankTracker";
import { runMonitoredSite } from "./monitoring";

/** Each HTTP request awaits at most one recipient, site, or small rank sweep.
 * A running/failed item blocks retries until reviewed; never replay an uncertain send. */
export async function runCloudflareSchedulerStep(): Promise<{ status: "completed" | "idle"; more: boolean }> {
  const client = await pool.connect();
  let locked = false;
  try {
    const lock = await client.query("SELECT pg_try_advisory_lock($1) AS acquired", [1947026073]);
    locked = !!lock.rows[0]?.acquired;
    if (!locked) return { status: "idle", more: false };
    const now = new Date();
    const plan = workerPlan(now);
    for (const item of plan) {
      if (item.job === "ranks") {
        if (!isDataForSeoConfigured()) continue;
        // Up to 25 tiny sweeps per hourly slot. Weekly/provider eligibility stays server-side.
        await client.query(`INSERT INTO scheduled_job_items (job, slot, subject_id, expires_at)
          SELECT $1, $2, n::text, now() + interval '2 hours' FROM generate_series(1,25) n
          ON CONFLICT (job, slot, subject_id) DO NOTHING`, [item.job, item.slot]);
      } else if (item.job === "monitoring") {
        await client.query(`INSERT INTO scheduled_job_items (job, slot, subject_id, expires_at)
          SELECT 'monitoring', COALESCE(next_run_at::text, 'initial'), id::text, now() + interval '2 days'
          FROM monitored_sites WHERE active = true AND (next_run_at IS NULL OR next_run_at <= now())
          ON CONFLICT (job, slot, subject_id) DO NOTHING`);
      } else {
        if (!process.env.POSTMARK_API_TOKEN) continue;
        await client.query(`INSERT INTO scheduled_job_items (job, slot, subject_id, expires_at)
          SELECT $1, $2, id, now() + interval '2 days' FROM users
          WHERE email_verified = true AND email_opt_out = false AND email IS NOT NULL
          ON CONFLICT (job, slot, subject_id) DO NOTHING`, [item.job, item.slot]);
      }
    }
    const claimed = await client.query<{ id: string; job: WorkerJob; slot: string; subject_id: string }>(`UPDATE scheduled_job_items SET status='running', started_at=now()
      WHERE id = (SELECT p.id FROM scheduled_job_items p WHERE p.status='pending' AND p.expires_at > now()
        AND NOT EXISTS (SELECT 1 FROM scheduled_job_items u WHERE u.status IN ('running','failed') AND (
          (u.job=p.job AND (u.subject_id=p.subject_id OR p.job='ranks')) OR
          (u.subject_id=p.subject_id AND u.job NOT IN ('ranks','monitoring') AND p.job NOT IN ('ranks','monitoring'))
        )) ORDER BY p.id LIMIT 1)
      RETURNING id, job, slot, subject_id`);
    const item = claimed.rows[0];
    if (!item) {
      const uncertain = await client.query("SELECT 1 FROM scheduled_job_items WHERE status IN ('running','failed') LIMIT 1");
      if (uncertain.rows.length) throw new Error("Scheduled work requires review");
      return { status: "idle", more: false };
    }
    try {
      if (item.job === "ranks") {
        const attempted = await runDueSeoRankSnapshots(1);
        if (attempted === 0) {
          await client.query("UPDATE scheduled_job_items SET status='completed', finished_at=now() WHERE job='ranks' AND slot=$1 AND status='pending'", [item.slot]);
        }
      } else if (item.job === "monitoring") {
        const [site] = await db.select().from(monitoredSitesTable).where(eq(monitoredSitesTable.id, Number(item.subject_id)));
        // A manual check may have advanced this site while its queue item waited.
        if (site?.active && (!site.nextRunAt || site.nextRunAt <= new Date())) await runMonitoredSite(site);
      } else {
        await runScheduledEmailForUser(item.job, item.subject_id);
      }
      await client.query("UPDATE scheduled_job_items SET status='completed', finished_at=now() WHERE id=$1", [item.id]);
      return { status: "completed", more: true };
    } catch {
      await client.query("UPDATE scheduled_job_items SET status='failed', finished_at=now() WHERE id=$1", [item.id]);
      throw new Error("Scheduled work requires review");
    }
  } finally {
    if (locked) await client.query("SELECT pg_advisory_unlock($1)", [1947026073]).catch(() => undefined);
    client.release();
  }
}
