import test from "node:test";
import assert from "node:assert/strict";
import { isWikiArticleConfident } from "./entityConfidence.ts";
import { isAllowedByRobots, parseRobotsTxt } from "./robotsPolicy.ts";

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
