import test from "node:test";
import assert from "node:assert/strict";
import { merchantPrompts, appendWithinLimit } from "./merchant-prompts.ts";

test("manual observations create three synthetic questions only with both inputs", () => {
  assert.deepEqual(merchantPrompts(" ", "support"), []);
  assert.deepEqual(merchantPrompts("shoes", ""), []);
  const prompts = merchantPrompts("walking\nshoes", "arch support");
  assert.equal(prompts.length, 3);
  assert.ok(prompts.every(p => p.includes("walking shoes") && p.includes("arch support")));
  assert.ok(prompts.every(p => !p.includes("\n")));
});
test("adding questions preserves existing prompts and respects the plan cap", () => {
  const prompts = merchantPrompts("shoes", "support");
  assert.equal(appendWithinLimit("My question", prompts, 3).split("\n").length, 3);
  assert.ok(appendWithinLimit("My question", prompts, 3).startsWith("My question\n"));
  assert.equal(appendWithinLimit("a\nb\nc", prompts, 3), "a\nb\nc");
  assert.equal(appendWithinLimit("a", ["a", "b", "b"], 3), "a\nb");
  assert.equal(appendWithinLimit("a\nb", prompts, 1), "a\nb");
});
