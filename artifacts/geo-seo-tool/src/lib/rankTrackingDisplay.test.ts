import test from "node:test";
import assert from "node:assert/strict";
import { latestRankDisplay } from "./rankTrackingDisplay.ts";

test("shows a stored numeric rank even when result_present is false", () => {
  assert.equal(latestRankDisplay({ position: 12, result_present: false }), "Position 12");
});

test("does not treat a zero rank as a no-match value", () => {
  assert.equal(latestRankDisplay({ position: 0, result_present: false }), "Position 0");
});

test("shows no match only for an explicit null-position no-match result", () => {
  assert.equal(latestRankDisplay({ position: null, result_present: false }), "No matching result yet");
});