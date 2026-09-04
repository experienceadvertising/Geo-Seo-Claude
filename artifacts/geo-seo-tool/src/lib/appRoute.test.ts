import test from "node:test";
import assert from "node:assert/strict";
import { shouldUseAppShell } from "./appRoute.ts";

test("keeps signed-in support pages inside the dashboard shell", () => {
  for (const pathname of ["/", "/results/44", "/simulate/44", "/projects", "/recommended-tools", "/recommended-tools/", "/upgrade", "/methodology", "/methodology/", "/contact", "/contact/"]) {
    assert.equal(shouldUseAppShell(pathname, true), true, pathname);
  }
});

test("keeps public visitors and public SEO pages in the marketing layout", () => {
  assert.equal(shouldUseAppShell("/methodology", false), false);
  assert.equal(shouldUseAppShell("/pricing", true), false);
  assert.equal(shouldUseAppShell("/how-to-rank-in-chatgpt", true), false);
});
