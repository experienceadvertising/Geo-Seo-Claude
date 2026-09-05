import test from "node:test";
import assert from "node:assert/strict";
import { getImplementationGuide } from "../../../../lib/recommendations/src/implementation.ts";

test("known tasks receive specific steps and unknown historical tasks remain safe", () => {
  const brand = getImplementationGuide("brand-facts");
  assert.ok(brand.steps.some(step => step.includes("audience")));
  const technical = getImplementationGuide("nosnippet-directive");
  assert.match(technical.steps[0], /site owner/);
  assert.match(technical.verify, /does not prove/);
  for (const id of [undefined, "unknown-old-id", "org-schema", "question-headings"]) {
    const guide = getImplementationGuide(id);
    assert.equal(guide.steps.length, 3);
    assert.ok(guide.owner && guide.example && guide.verify && guide.measure);
    assert.ok(!JSON.stringify(guide).includes("\u2014"));
  }
});

test("implementation references are dated official sources and tasks remain specific", () => {
  for (const id of [undefined, "add-byline", "content-effort-curation", "unblock-crawlers"]) {
    const guide = getImplementationGuide(id);
    assert.ok(guide.sources.length);
    for (const source of guide.sources) {
      assert.match(source.url, /^https:\/\/developers\.(google|openai)\.com\//);
      assert.match(source.reviewed, /^\d{4}-\d{2}-\d{2}$/);
    }
  }
  assert.match(getImplementationGuide("add-byline").steps.join(" "), /actual author/);
  assert.match(getImplementationGuide("content-effort-curation").steps.join(" "), /descriptive link text/);
});

test("category and listing advice is conditional and credits site-specific experiments", () => {
  for (const id of ["add-faq", "increase-depth", "trim-filler"]) {
    const guide = getImplementationGuide(id);
    assert.ok(guide.context);
    assert.match(guide.context, /conditional|does not mean/);
    assert.ok(guide.sources.some(source => source.url.includes("searchpilot.com")));
    assert.ok(!JSON.stringify(guide).includes("\u2014"));
  }
});
