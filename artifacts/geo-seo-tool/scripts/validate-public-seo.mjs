import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ROUTES, SITE_ORIGIN } from "./seo-manifest.mjs";
import { releases } from "./changelog-content.mjs";

for (const route of ROUTES) {
  const file = new URL(`../dist/public/${route.path === "/" ? "index.html" : route.path.slice(1)}`, import.meta.url);
  const html = readFileSync(file, "utf8");
  const count = pattern => (html.match(pattern) || []).length;
  assert.equal(count(/<h1\b/g), 1, `${route.path}: one static H1`);
  assert.equal(count(/<title\b/g), 1, `${route.path}: one title`);
  assert.equal(count(/name="description"/g), 1, `${route.path}: one description`);
  assert.equal(count(/rel="canonical"/g), 1, `${route.path}: one canonical`);
  assert.ok(html.includes(`href="${SITE_ORIGIN}${route.path}"`), `${route.path}: canonical matches route`);
  assert.equal(count(/<script data-app-boot>/g), 1, `${route.path}: pre-paint gate`);
  assert.ok(html.indexOf('<script data-app-boot>') < html.indexOf('<body>'));
  assert.ok(html.includes(`data-static-route="${route.path}"`), `${route.path}: readable fallback`);
  assert.ok(!html.includes('<h2>undefined</h2>'));
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    JSON.parse(match[1]);
  }
}
const home = readFileSync(new URL('../dist/public/index.html', import.meta.url), 'utf8');
const changelog = readFileSync(new URL('../dist/public/changelog', import.meta.url), 'utf8');
for (const entry of releases.entries) {
  assert.ok(changelog.includes('id="' + entry.slug + '"'), "Release anchor in initial HTML: " + entry.slug);
  assert.ok(changelog.includes(entry.isoDate), "Release date in initial HTML");
  for (const link of entry.links) assert.ok(changelog.includes('href="' + link.href + '"'));
}
assert.ok(!changelog.includes('<h2>Audit, simulate, improve, and monitor</h2>'));
assert.ok(home.includes('Measure progress on Pro and Agency'));
assert.ok(!home.includes('scores website visibility across ChatGPT'));
console.log(`Validated metadata, schema JSON, headings, and loading fallback for ${ROUTES.length} public routes.`);
