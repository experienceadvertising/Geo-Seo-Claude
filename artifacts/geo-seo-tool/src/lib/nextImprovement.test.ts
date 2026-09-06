import test from "node:test";
import assert from "node:assert/strict";
import { nextImprovement, improvementLink } from "./nextImprovement.ts";

const recs = [
  { id: "trim-filler", title: "Low", detail: "Example", priority: "low" },
  { id: "content-effort-methodology", title: "High", detail: "Example", priority: "high" },
  { id: "direct-answer-block", title: "Critical", detail: "Example", priority: "critical" },
];
test("prioritizes blockers without changing the stored list", () => {
  assert.equal(nextImprovement(recs, new Set(), "ready").task?.id, "direct-answer-block");
  assert.equal(recs[0].id, "trim-filler");
  assert.equal(nextImprovement(recs, new Set(["direct-answer-block"]), "ready").task?.id, "content-effort-methodology");
});
test("loading, failure and no recommendations never mean complete", () => {
  assert.equal(nextImprovement(undefined, new Set(), "loading").state, "loading");
  assert.equal(nextImprovement(recs, new Set(), "error").state, "error");
  assert.equal(nextImprovement([], new Set(), "ready").state, "empty");
});
test("only confirmed completion of the whole current catalog-backed list is complete", () => {
  assert.equal(nextImprovement(recs, new Set(recs.map(r => r.id)), "ready").state, "complete");
  assert.equal(nextImprovement([{ title: "Legacy", detail: "No ID" }], new Set(), "ready").state, "empty");
  assert.equal(nextImprovement([{ id: "unknown", title: "Unknown", detail: "Not catalog-backed" }], new Set(), "ready").state, "empty");
});
test("task links encode IDs and retain the action section", () => {
  assert.equal(improvementLink(40, "a&b"), "/actions/40?task=a%26b#recommendations");
  assert.equal(improvementLink(40), "/actions/40#recommendations");
});
