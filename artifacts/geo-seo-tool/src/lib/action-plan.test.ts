import test from "node:test";
import assert from "node:assert/strict";
import {
  friendlyRecommendationCategory,
  normalizedAuditPage,
  recommendationChannels,
  recommendationScope,
  siteRewriteSuggestion,
  uniqueAuditedPageCount,
} from "./action-plan.ts";

test("action plan labels page findings and site controls accurately", () => {
  assert.equal(recommendationScope("direct-answer-block"), "Audited page");
  assert.equal(recommendationScope("unblock-crawlers"), "Site control");
  assert.deepEqual(recommendationChannels("technical", "unblock-crawlers"), ["GEO"]);
  assert.deepEqual(recommendationChannels("freshness", "current-year-stats"), ["SEO", "GEO"]);
  assert.equal(friendlyRecommendationCategory("authority"), "Evidence and authority");
});

test("site coverage counts unique audited pages without query or host variants", () => {
  assert.equal(normalizedAuditPage("https://WWW.Example.com/services/?utm_source=test#top"), "example.com/services");
  assert.equal(uniqueAuditedPageCount([
    "https://example.com/",
    "https://www.example.com/?campaign=one",
    "https://example.com/services/",
    "https://other.example/about",
  ], "example.com"), 2);
});

test("uses saved page copy as the direct-answer rewrite starting point", () => {
  const rewrite = siteRewriteSuggestion(
    { id: "direct-answer-block", category: "answerability" },
    {
      url: "https://example.com/",
      title: "Analytics Consulting | Example",
      description: "We help growth teams find and fix gaps in their analytics.",
      brandName: "Example",
    },
  );

  assert.equal(rewrite?.draft, "We help growth teams find and fix gaps in their analytics.");
  assert.deepEqual(rewrite?.groundedIn, ["page title", "meta description", "detected brand"]);
});

test("leaves missing brand facts as explicit fields instead of inventing claims", () => {
  const rewrite = siteRewriteSuggestion(
    { id: "brand-facts", category: "entity" },
    { url: "https://example.com/", title: "Analytics Consulting | Example", brandName: "Example" },
  );

  assert.match(rewrite?.draft ?? "", /\[specific customer\]/);
  assert.match(rewrite?.draft ?? "", /\[verified differentiator\]/);
});

test("does not force content rewrites onto technical recommendations", () => {
  const rewrite = siteRewriteSuggestion(
    { id: "llms-txt", category: "technical" },
    { url: "https://example.com/", title: "Example" },
  );
  assert.equal(rewrite, null);
});
