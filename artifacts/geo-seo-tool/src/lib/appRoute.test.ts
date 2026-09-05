import test from "node:test";
import assert from "node:assert/strict";
import { shouldUseAppShell, pageWorkspaceLink } from "./appRoute.ts";

test("desktop and mobile workspace navigation preserves the selected audit", () => {
  assert.equal(pageWorkspaceLink("/seo", "/actions/42"), "/seo/42");
  assert.equal(pageWorkspaceLink("/actions", "/simulate/9"), "/actions/9");
  assert.equal(pageWorkspaceLink("/ai-visibility", "/seo/40"), "/ai-visibility/40");
  assert.equal(pageWorkspaceLink("/projects", "/seo/40"), "/projects");
  assert.equal(pageWorkspaceLink("/seo", "/recommended-tools"), "/seo");
});

test("keeps signed-in support pages inside the dashboard shell", () => {
  for (const pathname of ["/", "/seo", "/seo/44", "/actions", "/actions/44", "/ai-visibility", "/ai-visibility/44", "/results/44", "/simulate/44", "/projects", "/recommended-tools", "/recommended-tools/", "/upgrade", "/methodology", "/methodology/", "/contact", "/contact/"]) {
    assert.equal(shouldUseAppShell(pathname, true), true, pathname);
  }
});

test("keeps public visitors and public SEO pages in the marketing layout", () => {
  assert.equal(shouldUseAppShell("/methodology", false), false);
  assert.equal(shouldUseAppShell("/pricing", true), false);
  assert.equal(shouldUseAppShell("/how-to-rank-in-chatgpt", true), false);
});
