import test from "node:test";
import assert from "node:assert/strict";
import { workerPlan, workerEnabled, runWorkerSlot } from "./workerPlan.ts";

test("worker requires both activation gates", () => {
  assert.equal(workerEnabled({}), false);
  assert.equal(workerEnabled({ SCHEDULED_WORKER_ENABLED: "true" }), false);
  assert.equal(workerEnabled({ SCHEDULER_MODE: "external" }), false);
  assert.equal(workerEnabled({ SCHEDULED_WORKER_ENABLED: "true", SCHEDULER_MODE: "external" }), true);
});
test("hourly rank slot and daily catch-up are UTC-based", () => {
  assert.deepEqual(workerPlan(new Date("2026-09-05T01:05:00Z")), [{ job: "ranks", slot: "2026-09-05T01" }]);
  const jobs = workerPlan(new Date("2026-09-05T12:05:00Z"));
  assert.equal(jobs.length, 5);
  assert.ok(jobs.some(item => item.job === "welcome" && item.slot === "2026-09-05"));
  assert.ok(!jobs.some(item => item.job === "weekly-digest"));
});
test("weekly and monthly jobs stay on their calendar dates", () => {
  assert.ok(workerPlan(new Date("2026-09-07T09:00:00Z")).some(item => item.job === "weekly-digest"));
  assert.ok(workerPlan(new Date("2026-10-01T12:00:00Z")).some(item => item.job === "monthly-report" && item.slot === "2026-10"));
  assert.ok(workerPlan(new Date("2026-10-01T12:00:00Z")).some(item => item.job === "weekly-insights"));
  assert.throws(() => workerPlan(new Date("bad")));
});
test("claims before execution and never executes an already claimed slot", async () => {
  const seen = new Set<string>(); let executed = 0;
  const store = { claim: async (_job: string, slot: string) => { if (seen.has(slot)) return false; seen.add(slot); return true; }, finish: async () => {} };
  const item = { job: "welcome" as const, slot: "2026-09-05" };
  assert.equal(await runWorkerSlot(store, item, async () => { executed++; }), "completed");
  assert.equal(await runWorkerSlot(store, item, async () => { executed++; }), "skipped");
  assert.equal(executed, 1);
});
test("failed jobs retain a failed claim instead of replaying email side effects", async () => {
  const statuses: string[] = [];
  await assert.rejects(runWorkerSlot({ claim: async () => true, finish: async (_job, _slot, status) => { statuses.push(status); } }, { job: "trial", slot: "2026-09-05" }, async () => { throw new Error("private provider payload"); }), /Scheduled job trial failed/);
  assert.deepEqual(statuses, ["failed"]);
});
