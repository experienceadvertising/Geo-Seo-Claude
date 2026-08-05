import test from "node:test";
import assert from "node:assert/strict";
import * as cheerio from "cheerio";
import { isWikiArticleConfident } from "./entityConfidence.ts";
import { buildPageUrlVariants, rankSearchOpportunities } from "./gscOpportunities.ts";
import { isAllowedByRobots, parseRobotsTxt } from "./robotsPolicy.ts";
import { extractDataNoSnippetSignals } from "./snippetControls.ts";

test("rejects an ambiguous publication as a brand entity", () => {
  assert.equal(isWikiArticleConfident({
    title: "Notion (magazine)",
    description: "American music magazine",
    extract: "Notion is a music and fashion publication.",
  }, "Notion", "notion.so"), false);
});

test("accepts a business entity when its domain is in the article", () => {
  assert.equal(isWikiArticleConfident({
    title: "Notion (productivity software)",
    description: "Productivity software company",
    extract: "The product is available at notion.so.",
  }, "Notion", "notion.so"), true);
});

test("evaluates path-specific robots rules with allow tie precedence", () => {
  const rules = parseRobotsTxt(`
User-agent: OAI-SearchBot
Disallow: /private/
Allow: /private/public/

User-agent: *
Disallow: /tmp
`);
  assert.equal(isAllowedByRobots(rules, "oai-searchbot", "/private/report"), false);
  assert.equal(isAllowedByRobots(rules, "oai-searchbot", "/private/public/guide"), true);
  // A specific group replaces the wildcard group for this user-agent.
  assert.equal(isAllowedByRobots(rules, "oai-searchbot", "/tmp"), true);
  assert.equal(isAllowedByRobots(rules, "perplexitybot", "/tmp/file"), false);
});

test("supports wildcards and end anchors", () => {
  const rules = parseRobotsTxt("User-agent: *\nDisallow: /*.pdf$\nAllow: /guides/*.pdf$");
  assert.equal(isAllowedByRobots(rules, "perplexitybot", "/report.pdf"), false);
  assert.equal(isAllowedByRobots(rules, "perplexitybot", "/guides/report.pdf"), true);
  assert.equal(isAllowedByRobots(rules, "perplexitybot", "/report.pdf?download=1"), true);
});

test("measures section-level data-nosnippet content without double counting nested elements", () => {
  const $ = cheerio.load(`
    <main>
      <p data-nosnippet>Hide these four important answer words.</p>
      <section data-nosnippet>
        Hide this nested section too.
        <span data-nosnippet>Nested marker should count once.</span>
      </section>
      <p>This content remains available.</p>
    </main>
  `);
  assert.deepEqual(extractDataNoSnippetSignals($), {
    elementCount: 2,
    wordCount: 16,
  });
});

test("builds trailing-slash variants for Search Console page filters", () => {
  assert.deepEqual(buildPageUrlVariants("https://example.com/guides/aeo?ref=nav#top"), [
    "https://example.com/guides/aeo?ref=nav",
    "https://example.com/guides/aeo/?ref=nav",
  ]);
});

test("ranks Search Console opportunities and merges duplicate URL variants", () => {
  const opportunities = rankSearchOpportunities([
    { query: "answer engine optimization", page: "https://example.com/guide", clicks: 10, impressions: 100, ctr: 0.1, position: 7 },
    { query: "Answer Engine Optimization", page: "https://example.com/guide/", clicks: 5, impressions: 50, ctr: 0.1, position: 9 },
    { query: "very weak query", page: "https://example.com/guide", clicks: 0, impressions: 4, ctr: 0, position: 12 },
    { query: "too far away", page: "https://example.com/guide", clicks: 1, impressions: 500, ctr: 0.002, position: 42 },
  ]);

  assert.equal(opportunities.length, 1);
  assert.equal(opportunities[0].query, "answer engine optimization");
  assert.equal(opportunities[0].impressions, 150);
  assert.equal(opportunities[0].clicks, 15);
  assert.equal(opportunities[0].band, "quick_win");
  assert.equal(Math.round(opportunities[0].position * 10) / 10, 7.7);
});
