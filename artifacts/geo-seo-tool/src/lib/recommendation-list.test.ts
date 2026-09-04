import test from "node:test";
import assert from "node:assert/strict";
import { visibleRecommendations } from "./recommendation-list.ts";

const actions = Array.from({ length: 20 }, (_, i) => ({ id: String(i) }));
test("expanded action list never drops recommendations after item fourteen", () => {
  assert.equal(visibleRecommendations(actions, new Set(), "all", true).length, 20);
  assert.equal(visibleRecommendations(actions, new Set(), "all", false).length, 3);
});
test("filtering happens before the three-action limit", () => {
  const done = new Set(actions.slice(0, 17).map((r) => r.id));
  assert.deepEqual(visibleRecommendations(actions, done, "open", false), actions.slice(17));
  assert.equal(visibleRecommendations(actions, done, "done", true).length, 17);
  assert.deepEqual(visibleRecommendations(actions, new Set(), "done", true), []);
});
