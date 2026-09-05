import test from "node:test";
import assert from "node:assert/strict";
import { releases, changelogSchema, renderReleaseNotes } from "./changelog-content.mjs";
import { ROUTES } from "./seo-manifest.mjs";

test("release entries have unique stable anchors, real dates, evidence and safe action links", () => {
  const slugs = new Set();
  let previous = "9999-12-31";
  for (const entry of releases.entries) {
    assert.match(entry.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!slugs.has(entry.slug)); slugs.add(entry.slug);
    assert.match(entry.isoDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(entry.isoDate).toISOString().slice(0, 10), entry.isoDate);
    assert.ok(entry.isoDate <= previous); previous = entry.isoDate;
    assert.ok(entry.title && entry.summary && entry.audience && entry.evidence);
    assert.ok(entry.links.length);
    for (const link of entry.links) assert.match(link.href, /^\/(?!\/)[a-z0-9/-]*$/);
  }
  assert.ok(!JSON.stringify(releases).includes("\u2014"));
});

test("search metadata and crawlable notes derive from the visible release source", () => {
  const route = ROUTES.find(route => route.path === "/changelog");
  assert.equal(route.title, releases.title);
  assert.equal(route.modifiedTime, releases.entries[0].isoDate);
  assert.equal(changelogSchema.mainEntity.numberOfItems, releases.entries.length);
  const html = renderReleaseNotes();
  for (const entry of releases.entries) {
    assert.ok(html.includes('id="' + entry.slug + '"'));
    for (const link of entry.links) assert.ok(html.includes('href="' + link.href + '"'));
  }
  assert.equal((html.match(/<article /g) || []).length, releases.entries.length);
});
