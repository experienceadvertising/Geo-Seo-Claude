import test from "node:test";
import assert from "node:assert/strict";
import { nextImprovement, improvementLink } from "./nextImprovement.ts";

const recs = [
  { id: "low", title: "Low", detail: "Example", priority: "low" },
  { id: "high", title: "High", detail: "Example", priority: "high" },
  { id: "critical", title: "Critical", detail: "Example", priority: "critical" },
];
test("prioritizes blockers without changing the stored list", () => {
  assert.equal(nextImprovement(recs, new Set(), "ready").task?.id, "critical");
  assert.equal(recs[0].id, "low");
  assert.equal(nextImprovement(recs, new Set(["critical"]), "ready").task?.id, "high");
});
test("loading, failure and no recommendations never mean complete", () => {
  assert.equal(nextImprovement(undefined, new Set(), "loading").state, "loading");
  assert.equal(nextImprovement(recs, new Set(), "error").state, "error");
  assert.equal(nextImprovement([], new Set(), "ready").state, "empty");
});
test("only confirmed completion of the whole current list is complete", () => {
  assert.equal(nextImprovement(recs, new Set(recs.map(r => r.id)), "ready").state, "complete");
  assert.equal(nextImprovement([{ title: "Legacy", detail: "No ID" }], new Set(), "ready").state, "task");
});
test("task links encode IDs and retain the action section", () => {
  assert.equal(improvementLink(40, "a&b"), "/results/40?task=a%26b#recommendations");
  assert.equal(improvementLink(40), "/results/40#recommendations");
});
