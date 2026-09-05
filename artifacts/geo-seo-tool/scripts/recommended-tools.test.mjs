import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../src/pages/recommended-tools.tsx", import.meta.url), "utf8");
const channels = readFileSync(new URL("../src/components/authority-signals-card.tsx", import.meta.url), "utf8");

test("resource library separates practical tasks and keeps paid access explicit", () => {
  for (const text of ["Measure performance", "Fix and validate", "Expert learning resources", "Use it when:", "First step:", "subject to plan limits", "index={false}"]) {
    assert.ok(page.includes(text), text);
  }
  for (const host of ["pagespeed.web.dev", "validator.schema.org", "screamingfrog.co.uk", "bing.com/webmasters", "search.google.com/test/rich-results"]) {
    assert.ok(page.includes(host), host);
  }
  const official = page.split("const REFERENCE_RESOURCES = [")[1].split("];", 1)[0];
  assert.ok(!official.includes("LearningSEO"));
});

test("distribution descriptions preserve pricing and eligibility safeguards", () => {
  assert.match(channels, /name: "PodMatch",[\s\S]*?cost: "Paid"/);
  assert.ok(!channels.includes("Wikipedia / Wikidata"));
  assert.ok(channels.includes("not a routine growth task"));
  assert.ok(channels.includes("not a way to buy organic rankings"));
  assert.ok(page.includes('rel="noopener noreferrer"'));
  assert.ok(!/[\u2014]/.test(page));
});
