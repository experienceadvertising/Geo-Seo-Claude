import test from "node:test";
import assert from "node:assert/strict";
import { pageInProperty, summarizeInspection, createInspectionService, fetchGoogleInspection } from "./gscInspection.ts";

const now = new Date("2026-10-02T16:30:00Z");
const response = (days: number, verdict = "PASS") => ({ inspectionResult: { indexStatusResult: {
  lastCrawlTime: new Date(now.getTime() - days * 86_400_000).toISOString(), verdict, coverageState: "Submitted and indexed",
} } });

test("crawl-age checkpoints do not override Google's verdict", () => {
  for (const [days, expected] of [[89, "recent"], [90, "review"], [129, "review"], [130, "extended_gap"], [189, "extended_gap"], [190, "long_gap"]] as const) {
    const report = summarizeInspection(response(days), now);
    assert.equal(report.crawlAttention, expected); assert.equal(report.daysSinceLastCrawl, days); assert.equal(report.verdict, "PASS");
    assert.ok(!JSON.stringify(report).includes("deindexed"));
  }
  const recentExcluded = summarizeInspection(response(1, "NEUTRAL"), now);
  assert.ok(recentExcluded.nextSteps.some(step => step.includes("coverage state")));
});

test("missing, invalid and future crawl dates remain unavailable", () => {
  for (const lastCrawlTime of [undefined, "", "invalid", "2027-01-01T00:00:00Z"]) {
    const report = summarizeInspection({ inspectionResult: { indexStatusResult: { lastCrawlTime } } }, now);
    assert.equal(report.lastCrawlTime, null); assert.equal(report.daysSinceLastCrawl, null); assert.equal(report.crawlAttention, "unavailable");
  }
  assert.throws(() => summarizeInspection({}, now), /did not return indexing data/);
});

test("property membership rejects lookalike domains, credentials and different schemes", () => {
  assert.equal(pageInProperty("sc-domain:example.com", "https://www.example.com/page"), true);
  assert.equal(pageInProperty("sc-domain:example.com", "https://example.com.evil.test/"), false);
  assert.equal(pageInProperty("sc-domain:example.com", "https://notexample.com/"), false);
  assert.equal(pageInProperty("https://example.com/docs/", "https://example.com/docs/a"), true);
  assert.equal(pageInProperty("https://example.com/docs/", "https://example.com/docs-other/"), false);
  assert.equal(pageInProperty("https://example.com/", "http://example.com/"), false);
  assert.equal(pageInProperty("sc-domain:example.com", "https://user:pass@example.com/"), false);
});

test("inspection cache is tenant-specific and rechecks property access", async () => {
  let time = now; const inspect = createInspectionService(() => time); let calls = 0;
  const args = { userId: "a", siteUrl: "sc-domain:example.com", pageUrl: "https://example.com/", listSites: async () => [{ siteUrl: "sc-domain:example.com", permissionLevel: "siteOwner" }], fetchInspection: async () => { calls++; return response(146); } };
  const first = await inspect(args); await inspect(args); assert.equal(calls, 1);
  await inspect({ ...args, userId: "b" }); assert.equal(calls, 2);
  await assert.rejects(inspect({ ...args, listSites: async () => [] }), /not available/); assert.equal(calls, 2);
  await assert.rejects(inspect({ ...args, pageUrl: "https://evil.test/" }), /outside/); assert.equal(calls, 2);
  time = new Date(now.getTime() + 3_600_001); const refreshed = await inspect(args);
  assert.equal(calls, 3); assert.notEqual(refreshed.observedAt, first.observedAt);
});

test("concurrent inspections share provider work and failed requests do not become cache hits", async () => {
  const inspect = createInspectionService(() => now); let calls = 0;
  const args = { userId: "a", siteUrl: "sc-domain:example.com", pageUrl: "https://example.com/", listSites: async () => [{ siteUrl: "sc-domain:example.com", permissionLevel: "siteOwner" }], fetchInspection: async () => { calls++; throw new Error("provider unavailable"); } };
  await Promise.all([assert.rejects(inspect(args), /provider unavailable/), assert.rejects(inspect(args), /provider unavailable/)]);
  assert.equal(calls, 1); await assert.rejects(inspect(args)); assert.equal(calls, 2);
});

test("technical and canonical problems appear before content suggestions", () => {
  const report = summarizeInspection({ inspectionResult: { indexStatusResult: { robotsTxtState: "DISALLOWED", indexingState: "BLOCKED_BY_META_TAG", pageFetchState: "SERVER_ERROR", googleCanonical: "https://example.com/other", userCanonical: "https://example.com/page", verdict: "FAIL" } } }, now);
  assert.match(report.nextSteps[0], /robots/); assert.match(report.nextSteps[1], /noindex/); assert.match(report.nextSteps[2], /fetch/); assert.match(report.nextSteps[3], /canonical/);
});

test("provider errors are actionable and do not disclose upstream bodies", async () => {
  const original = globalThis.fetch;
  try {
    for (const status of [401, 403, 429, 500]) {
      globalThis.fetch = async () => new Response("private provider details", { status });
      await assert.rejects(fetchGoogleInspection("test-token", "sc-domain:example.com", "https://example.com/"), err => {
        assert.ok(err instanceof Error); assert.ok(!err.message.includes("private provider")); return true;
      });
    }
  } finally { globalThis.fetch = original; }
});

test("conservative per-property throttle blocks further provider work", async () => {
  const inspect = createInspectionService(() => now); let calls = 0;
  const args = { userId: "a", siteUrl: "sc-domain:example.com", listSites: async () => [{ siteUrl: "sc-domain:example.com", permissionLevel: "siteOwner" }], fetchInspection: async () => { calls++; return response(1); } };
  for (let i = 0; i < 60; i++) await inspect({ ...args, pageUrl: `https://example.com/${i}` });
  await assert.rejects(inspect({ ...args, pageUrl: "https://example.com/61" }), /allowance reached/); assert.equal(calls, 60);
});
