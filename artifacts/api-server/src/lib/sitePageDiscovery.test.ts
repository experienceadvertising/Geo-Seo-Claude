import assert from "node:assert/strict";
import test from "node:test";
import { pagePriority, selectImportantPages } from "./sitePageSelection.ts";

test("prioritizes commercial and brand pages over general content", () => {
  assert.ok(pagePriority("https://example.com/pricing") > pagePriority("https://example.com/blog/post"));
  assert.ok(pagePriority("https://example.com/about") > pagePriority("https://example.com/random"));
});

test("selects same-site canonical pages and filters utility URLs", () => {
  const selected = selectImportantPages([
    "/blog/good-guide?utm_source=test",
    "https://example.com/pricing/",
    "https://other.example/about",
    "/privacy",
    "/assets/logo.png",
    "/about",
    "/pricing#annual",
  ], "https://example.com/", 4);
  assert.deepEqual(selected, [
    "https://example.com/",
    "https://example.com/about",
    "https://example.com/pricing",
    "https://example.com/blog/good-guide",
  ]);
});
