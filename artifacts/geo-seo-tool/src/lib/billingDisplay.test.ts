import test from "node:test";
import assert from "node:assert/strict";
import { paidPlanActionDisabled, paidPlanActionLabel } from "./billingDisplay.ts";

test("labels the active subscription separately from plan changes", () => {
  assert.equal(paidPlanActionLabel("pro", "pro", true), "Current plan");
  assert.equal(paidPlanActionLabel("pro", "starter", true), "Switch to Starter in billing");
  assert.equal(paidPlanActionLabel("pro", "agency", true), "Switch to Agency in billing");
});

test("does not send manually granted paid access to a missing billing portal", () => {
  assert.equal(paidPlanActionLabel("pro", "agency", false), "Contact support to change plan");
  assert.equal(paidPlanActionDisabled("pro", "agency", false), true);
});

test("keeps checkout calls to action clear for free users", () => {
  assert.equal(paidPlanActionLabel("free", "starter", false), "Choose Starter");
  assert.equal(paidPlanActionLabel("free", "pro", false), "Upgrade to Pro");
  assert.equal(paidPlanActionDisabled("free", "pro", false), false);
});
