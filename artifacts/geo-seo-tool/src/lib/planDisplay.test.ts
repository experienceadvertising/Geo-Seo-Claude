import test from "node:test";
import assert from "node:assert/strict";
import { hasMonitoringAccess, monitoringAccessLabel } from "./planDisplay.ts";

test("labels a free user's temporary entitlement as guided trial access", () => {
  assert.equal(
    monitoringAccessLabel({ sitesUsed: 0, limit: 10, storedPlan: "free", trialActive: true }),
    "0/10 monitoring slots used during your guided trial.",
  );
});

test("labels a paid agency entitlement as the agency plan", () => {
  assert.equal(
    monitoringAccessLabel({ sitesUsed: 3, limit: 50, storedPlan: "agency", trialActive: false }),
    "3/50 sites used on your agency plan.",
  );
});

test("keeps monitoring available during the guided trial but not on free afterward", () => {
  assert.equal(hasMonitoringAccess("free", true), true);
  assert.equal(hasMonitoringAccess("free", false), false);
  assert.equal(hasMonitoringAccess("starter", false), false);
  assert.equal(hasMonitoringAccess("pro", false), true);
  assert.equal(hasMonitoringAccess("agency", false), true);
});
