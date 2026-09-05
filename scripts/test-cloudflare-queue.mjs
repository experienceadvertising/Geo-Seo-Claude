// Runs against an explicitly local disposable PostgreSQL cluster only.
// Provider, email and audit modules are replaced before importing the real queue.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
const apiRequire = createRequire(new URL("../artifacts/api-server/package.json", import.meta.url));
const dbRequire = createRequire(new URL("../lib/db/package.json", import.meta.url));
const { build } = apiRequire("esbuild");
const pgPath = dbRequire.resolve("pg");
const pg = dbRequire("pg");
const pool = new pg.Pool({ host: "127.0.0.1", port: 15493, database: "postgres", user: "adminuser" });
const calls = [];
globalThis.schedulerFixture = { pool, fail: false, record: async (job, subject) => {
  calls.push([job, subject]);
  if (globalThis.schedulerFixture.fail) throw new Error("Simulated uncertain provider result");
} };
const mocks = {
  "@workspace/db": `export const pool = globalThis.schedulerFixture.pool; export const monitoredSitesTable = {id: 'id'}; export const db = {select: () => ({from: () => ({where: async () => [{id: 42, active: true, nextRunAt: null}]})})};`,
  "drizzle-orm": `export const eq = () => undefined;`,
  "./workerPlan": `export const workerPlan = () => ['ranks','monitoring','welcome','trial','simulation-followup','weekly-digest','monthly-report','weekly-insights'].map(job => ({job,slot:'fixture-slot'}));`,
  "./emailScheduler": `export const runScheduledEmailForUser = (job, id) => globalThis.schedulerFixture.record(job, id);`,
  "./seoTrackingScheduler": `export const runDueSeoRankSnapshots = async (cap) => { if(cap!==1) throw new Error('unbounded sweep'); await globalThis.schedulerFixture.record('ranks', String(Math.random())); return 1; };`,
  "./dataforseoRankTracker": `export const isDataForSeoConfigured = () => true;`,
  "./monitoring": `export const runMonitoredSite = async site => {await globalThis.schedulerFixture.record('monitoring',String(site.id)); await globalThis.schedulerFixture.pool.query('UPDATE monitored_sites SET active=false WHERE id=42');};`,
};
try {
  await pool.query("CREATE TABLE users (id text PRIMARY KEY, email_verified boolean, email_opt_out boolean, email text); CREATE TABLE monitored_sites (id integer PRIMARY KEY, active boolean, next_run_at timestamptz)");
  await pool.query(await readFile(new URL("./sql/cloudflare-scheduler-items.sql", import.meta.url), "utf8"));
  await pool.query("INSERT INTO users VALUES ('fixture-a',true,false,'a@example.invalid'),('fixture-b',true,false,'b@example.invalid'),('opted-out',true,true,'c@example.invalid'),('unverified',false,false,'d@example.invalid'); INSERT INTO monitored_sites VALUES(42,true,NULL)");
  const dir = await mkdtemp(join(tmpdir(), "aeo-scheduler-fixture-"));
  const outfile = join(dir, "queue.mjs");
  await build({ entryPoints: [fileURLToPath(new URL("../artifacts/api-server/src/lib/cloudflareScheduler.ts", import.meta.url))], outfile, bundle: true, platform: "node", format: "esm", external: [pgPath], plugins: [{name:"fixture-only",setup(b){
    b.onResolve({filter:/.*/}, args => mocks[args.path] ? {path:args.path,namespace:"fixture"} : undefined);
    b.onLoad({filter:/.*/,namespace:"fixture"}, args => ({contents:mocks[args.path],loader:"js"}));
  }}] });
  const { runCloudflareSchedulerStep } = await import(pathToFileURL(outfile));
  process.env.POSTMARK_API_TOKEN = "fixture-only";
  for(let i=0;i<38;i++) assert.equal((await runCloudflareSchedulerStep()).status,"completed");
  assert.deepEqual(await runCloudflareSchedulerStep(),{status:"idle",more:false});
  assert.equal(calls.length,38);
  assert.equal(calls.filter(([job])=>job==='ranks').length,25);
  assert.equal(calls.filter(([job])=>job==='monitoring').length,1);
  assert.ok(calls.every(([,subject])=>!['opted-out','unverified'].includes(subject)));
  await Promise.all([runCloudflareSchedulerStep(),runCloudflareSchedulerStep()]);
  assert.equal(calls.length,38, "completed slots are not replayed by concurrent requests");
  await pool.query("INSERT INTO users VALUES ('fixture-failure',true,false,'e@example.invalid')");
  globalThis.schedulerFixture.fail = true;
  await assert.rejects(runCloudflareSchedulerStep(), /requires review/);
  const afterFailure = calls.length;
  await assert.rejects(runCloudflareSchedulerStep(), /requires review/);
  assert.equal(calls.length,afterFailure,"uncertain sends are not replayed");
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM scheduled_job_items WHERE status='failed'")).rows[0].n,1);
  console.log("PASS: real PostgreSQL queue, 38 bounded jobs, recipient eligibility, unique slots, concurrent repeat protection, persistent failure protection");
} finally {
  await pool.end();
  delete globalThis.schedulerFixture;
}
