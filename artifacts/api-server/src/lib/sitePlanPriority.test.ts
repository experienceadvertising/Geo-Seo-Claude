import assert from "node:assert/strict";
import test from "node:test";
import { sitePlanPriority } from "./sitePlanPriority.ts";

test("blockers outrank non-blocking keyword opportunities", () => {
  assert.ok(sitePlanPriority({next: {priority: "critical"}, rankings: []}) > sitePlanPriority({next: {priority: "high"}, rankings: [{position: 12, stale: false}]}));
});
test("fresh opportunity ranks break ties but missing and stale ranks do not", () => {
  const score = (position: number | null, stale = false) => sitePlanPriority({next: {priority: "high"}, rankings: [{position, stale}]});
  assert.equal(score(12), 60);
  for (const position of [null, 1, 3, 21]) assert.equal(score(position), 50);
  assert.equal(score(12, true), 50);
  assert.equal(sitePlanPriority({rankings: [{position: 12, stale: false}]}), -1);
});
