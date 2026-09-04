import test from "node:test";
import assert from "node:assert/strict";
import { collectionMessage, landingPageDiffers, searchPropertyMatchesPage } from "./seoProgress.ts";
import { sameAuditPage } from "./auditProgress.ts";

test("audit progress does not compare different pages or domains", () => {
  assert.equal(sameAuditPage("https://a.test/", "https://b.test/"), false);
  assert.equal(sameAuditPage("https://a.test/", "https://a.test/pricing"), false);
  assert.equal(sameAuditPage("https://a.test/#x", "https://a.test"), true);
  assert.equal(sameAuditPage("bad", "bad"), false);
});
test("tracking distinguishes configured, queued, failed and stale observations", () => {
  const target = { active: true };
  assert.match(collectionMessage(target, true), /Awaiting first/);
  assert.match(collectionMessage(target, false), /Provider unavailable/);
  assert.match(collectionMessage({ active: false }, true), /Paused/);
  assert.match(collectionMessage({ ...target, collection: { status: "queued", created_at: "2026-09-04" } }, true), /queued/);
  assert.match(collectionMessage({ ...target, collection: { status: "failed", created_at: "2026-09-04" } }, true), /failed/);
  assert.match(collectionMessage({ ...target, latest: { collected_at: "2026-09-01" } }, true, Date.parse("2026-09-10")), /overdue/);
  assert.match(collectionMessage({ ...target, latest: { collected_at: "2026-09-04" } }, true, Date.parse("2026-09-05")), /Baseline recorded/);
});
test("landing page guidance handles URL variants without inventing a mismatch", () => {
  assert.equal(landingPageDiffers("https://www.a.test/page/", "https://a.test/page"), false);
  assert.equal(landingPageDiffers("https://a.test/page", "https://a.test/other"), true);
  assert.equal(landingPageDiffers("https://a.test/", null), false);
});
test("Search Console never substitutes an unrelated property", () => {
  assert.equal(searchPropertyMatchesPage("sc-domain:example.com", "https://www.example.com/page"), true);
  assert.equal(searchPropertyMatchesPage("sc-domain:example.com", "https://notexample.com/page"), false);
  assert.equal(searchPropertyMatchesPage("https://example.com/", "https://example.com.evil.test/"), false);
  assert.equal(searchPropertyMatchesPage("https://example.com/blog/", "https://example.com/pricing"), false);
  assert.equal(searchPropertyMatchesPage("invalid", "https://example.com/"), false);
});
