import test from "node:test";
import assert from "node:assert/strict";
import * as cheerio from "cheerio";
import { PgDialect } from "drizzle-orm/pg-core";
import { isWikiArticleConfident } from "./entityConfidence.ts";
import { buildPageUrlVariants, rankSearchOpportunities } from "./gscOpportunities.ts";
import { isAllowedByRobots, parseRobotsTxt } from "./robotsPolicy.ts";
import { extractContentSignals } from "./geoRecommendations.ts";
import { errorHandler } from "../middlewares/errorHandler.ts";
import { SsrfError } from "./safeFetch.ts";
import { extractDataNoSnippetSignals } from "./snippetControls.ts";
import { buildLatestRankSnapshotsQuery } from "./seoTrackingQueries.ts";
import {
  highestPaidPlan,
  isBlockingSubscriptionStatus,
  isEntitlingSubscriptionStatus,
  planChangeDirection,
  validateCheckoutPrice,
} from "./billingPolicy.ts";

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

test("checkout accepts only active recurring USD prices for the requested approved plan", () => {
  const starterProduct = { metadata: { plan_id: "starter" } } as any;
  const proProduct = { metadata: { plan_id: "pro" } } as any;
  const starterPrice = { active: true, currency: "usd", recurring: { interval: "month" }, product: starterProduct } as any;
  const validPrice = { active: true, currency: "usd", recurring: { interval: "month" }, product: proProduct } as any;

  assert.deepEqual(validateCheckoutPrice(starterPrice, "starter"), { ok: true, plan: "starter" });
  assert.deepEqual(validateCheckoutPrice(validPrice, "pro"), { ok: true, plan: "pro" });
  assert.equal(validateCheckoutPrice({ ...validPrice, active: false }, "pro").ok, false);
  assert.equal(validateCheckoutPrice({ ...validPrice, recurring: null }, "pro").ok, false);
  assert.equal(validateCheckoutPrice({ ...validPrice, currency: "eur" }, "pro").ok, false);
  assert.equal(validateCheckoutPrice(validPrice, "agency").ok, false);
  assert.equal(validateCheckoutPrice({ ...validPrice, product: { metadata: { plan_id: "internal" } } }, "pro").ok, false);
});

test("subscription policy blocks duplicate billing while preserving paid grace access", () => {
  for (const status of ["active", "trialing", "past_due", "incomplete", "paused", "unpaid"]) {
    assert.equal(isBlockingSubscriptionStatus(status), true, `${status} should block a second checkout`);
  }
  assert.equal(isBlockingSubscriptionStatus("canceled"), false);
  assert.equal(isBlockingSubscriptionStatus("incomplete_expired"), false);
  assert.equal(isEntitlingSubscriptionStatus("past_due"), true);
  assert.equal(isEntitlingSubscriptionStatus("unpaid"), false);
});

test("billing reconciliation keeps the highest active entitlement and labels plan changes correctly", () => {
  assert.equal(highestPaidPlan([null, "pro", "agency"]), "agency");
  assert.equal(highestPaidPlan(["starter", "pro"]), "pro");
  assert.equal(highestPaidPlan([null]), null);
  assert.equal(planChangeDirection("free", "pro"), "Upgrade");
  assert.equal(planChangeDirection("starter", "pro"), "Upgrade");
  assert.equal(planChangeDirection("pro", "starter"), "Downgrade");
  assert.equal(planChangeDirection("pro", "agency"), "Upgrade");
  assert.equal(planChangeDirection("agency", "pro"), "Downgrade");
});

test("rank tracking skips the snapshot lookup when there are no keyword targets", () => {
  assert.equal(buildLatestRankSnapshotsQuery([]), null);
});

test("rank tracking loads latest snapshots after one keyword target is added", () => {
  const query = buildLatestRankSnapshotsQuery([26]);
  assert.ok(query);

  const compiled = new PgDialect().sqlToQuery(query);
  assert.match(compiled.sql, /target_id IN \(\$1\)/);
  assert.doesNotMatch(compiled.sql, /ANY\s*\(/);
  assert.deepEqual(compiled.params, [26]);
});

test("rank tracking binds each of multiple keyword targets safely", () => {
  const query = buildLatestRankSnapshotsQuery([26, 27]);
  assert.ok(query);

  const compiled = new PgDialect().sqlToQuery(query);
  assert.match(compiled.sql, /target_id IN \(\$1, \$2\)/);
  assert.deepEqual(compiled.params, [26, 27]);
});

test("an explicit user-agent group with an empty Disallow overrides a restrictive wildcard group", () => {
  const rules = parseRobotsTxt(`
User-agent: *
Disallow: /

User-agent: GPTBot
Disallow:
`);
  // The canonical "allow this bot everything" idiom: a named group with no
  // rules must NOT fall through to the "*" block.
  assert.equal(isAllowedByRobots(rules, "gptbot", "/pricing"), true);
  assert.equal(isAllowedByRobots(rules, "claudebot", "/pricing"), false);
});

test("brand-facts detection recognises an audience/problem statement in the opening copy", () => {
  const $ = cheerio.load(`
    <html><body><main>
      <h1>Acme</h1>
      <p>Acme is a payments platform for small businesses that helps them get paid faster.</p>
    </main></body></html>
  `);
  const signals = extractContentSignals($, "https://acme.com/", "Acme");
  // A regex literal written as /\\b.../ matched a literal backslash-b and
  // made this false for every page, firing the "brand-facts" rec everywhere.
  assert.equal(signals.hasBrandFactsStatement, true);
});

test("JSON error handler preserves client-caused statuses and hides internals", () => {
  type Sent = { status: number; body: unknown };
  const run = (err: unknown): Sent => {
    const sent: Sent = { status: 0, body: null };
    const res = {
      headersSent: false,
      status(code: number) { sent.status = code; return this; },
      json(body: unknown) { sent.body = body; return this; },
    };
    const req = { log: { error: () => undefined }, userId: "u1", path: "/api/x" };
    errorHandler(err, req as never, res as never, () => undefined);
    return sent;
  };
  assert.deepEqual(run(new SsrfError("Private/internal IP addresses are not allowed")), {
    status: 400,
    body: { error: "Private/internal IP addresses are not allowed" },
  });
  assert.deepEqual(run(Object.assign(new Error("too big"), { status: 413, type: "entity.too.large" })), {
    status: 413,
    body: { error: "Request body too large" },
  });
  assert.deepEqual(run(new Error("db connection string leaked here")), {
    status: 500,
    body: { error: "Internal server error" },
  });
});
