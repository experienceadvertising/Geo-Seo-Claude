import test from "node:test";
import assert from "node:assert/strict";
import { sameAuditedPage } from "./auditComparison.ts";
import { competitorContext, freshInsight, insightLimit, parseKeywordInsight, selectInsightTargets } from "./seoKeywordInsights.ts";

test("keyword insights preserve unknowns and distinguish real zero demand", () => {
  const missing = parseKeywordInsight({});
  assert.equal(missing.searchVolume, null);
  assert.equal(missing.intent, null);
  const parsed = parseKeywordInsight({ keyword_info: { search_volume: 0, monthly_searches: [{ year: 2026, month: 2, search_volume: null }, { year: 2026, month: 1, search_volume: 0 }, { year: 2026, month: 13, search_volume: 9 }] }, search_intent_info: { main_intent: "commercial" } });
  assert.equal(parsed.searchVolume, 0);
  assert.equal(parsed.intent, "commercial");
  assert.deepEqual(parsed.monthlySearches.map((m: any) => m.volume), [0, null]);
  assert.equal(parseKeywordInsight({ keyword_info: { search_volume: -1 } }).searchVolume, null);
});
test("insight cache and account allowance block repeated spending", () => {
  const now = Date.parse("2026-09-05T00:00:00Z");
  assert.equal(freshInsight({ collectedAt: "2026-09-04" }, now), true);
  assert.equal(freshInsight({ collectedAt: "2026-10-01" }, now), false);
  assert.equal(freshInsight({ collectedAt: "invalid" }, now), false);
  const targets = Array.from({ length: 120 }, (_, id) => ({ id, locationCode: 2840, languageCode: "en", insights: null }));
  assert.equal(selectInsightTargets(targets, new Set(), "free", now).length, 0);
  assert.equal(selectInsightTargets(targets, new Set(), "pro", now).length, 25);
  assert.equal(selectInsightTargets(targets, new Set(), "agency", now).length, 100);
  assert.equal(selectInsightTargets(targets, new Set(Array.from({ length: 25 }, (_, i) => i)), "pro", now).length, 0);
  assert.equal(selectInsightTargets(targets.map(t => ({ ...t, locationCode: t.id })), new Set(), "agency", now).length, 4);
  assert.equal(selectInsightTargets([{ ...targets[0], insights: { collectedAt: "2026-09-04" } }], new Set(), "pro", now).length, 0);
  assert.equal(insightLimit("unknown"), 0);
});
test("search competitors are bounded, safe, distinct and ahead of the tracked result", () => {
  const items = [
    { type: "organic", url: "https://example.com", rank_absolute: 1 },
    { type: "organic", url: "javascript:alert(1)", rank_absolute: 2 },
    { type: "organic", url: "https://other.com/a", rank_absolute: 3, title: "Other" },
    { type: "organic", url: "https://other.com/b", rank_absolute: 4 },
    { type: "paid", url: "https://ad.com", rank_absolute: 2 },
    { type: "organic", url: "https://later.com", rank_absolute: 7 },
  ];
  assert.deepEqual(competitorContext(items, "example.com", 5).map(r => r.domain), ["other.com"]);
  assert.equal(competitorContext(items, "example.com", null).length, 2);
  assert.equal(competitorContext(items, "example.com", 1).length, 0);
});

test("weekly score changes compare the same page, not unrelated pages on a domain", () => {
  assert.equal(sameAuditedPage("https://example.com/", "https://example.com/about"), false);
  assert.equal(sameAuditedPage("https://example.com/a?lang=en", "https://example.com/a?lang=fr"), false);
  assert.equal(sameAuditedPage("https://example.com/a#intro", "https://example.com/a"), true);
  assert.equal(sameAuditedPage("https://example.com", "https://example.com/"), true);
  assert.equal(sameAuditedPage("invalid", "invalid"), false);
});
import * as cheerio from "cheerio";
import { PgDialect } from "drizzle-orm/pg-core";
import { isWikiArticleConfident } from "./entityConfidence.ts";
import { buildPageUrlVariants, rankSearchOpportunities } from "./gscOpportunities.ts";
import { isAllowedByRobots, parseRobotsTxt } from "./robotsPolicy.ts";
import { extractContentSignals } from "./geoRecommendations.ts";
import { errorHandler } from "../middlewares/errorHandler.ts";
import { SsrfError } from "./safeFetch.ts";
import { extractDataNoSnippetSignals } from "./snippetControls.ts";
import { buildLatestRankSnapshotsQuery, buildRankEligibilityQuery, buildLatestRankTasksQuery } from "./seoTrackingQueries.ts";
import { summarizeRankProgress } from "./seoProgressSummary.ts";

test("rank scheduling allows a new baseline, guards pending tasks and keeps success weekly", () => {
  const query = new PgDialect().sqlToQuery(buildRankEligibilityQuery(new Date("2026-09-04T00:00:00Z")));
  assert.match(query.sql, /updated_at = seo_keyword_targets.created_at/);
  assert.match(query.sql, /provider_status = 'success'/);
  assert.match(query.sql, /status = 'queued'/);
  assert.deepEqual(query.params, [new Date("2026-09-03T00:00:00Z"), new Date("2026-08-28T00:00:00Z"), new Date("2026-09-03T00:00:00Z")]);
  assert.equal(buildLatestRankTasksQuery([]), null);
});
test("weekly summaries separate observations, numeric rankings and stale data", () => {
  assert.deepEqual(summarizeRankProgress(3, [
    { position: null, collected_at: "2026-09-04" },
    { position: 9, collected_at: "2026-08-01" },
  ], Date.parse("2026-09-04")), { activeKeywords: 3, rankedKeywords: 2, pendingKeywords: 1, foundKeywords: 1, staleKeywords: 1 });
});
import { isPaidSeoPlan } from "./seoAccess.ts";
import { extractCompetitorBrandsFromText, looksLikeCompetitorBrand } from "./competitorNames.ts";
import { normalizeGeneratedPromptLine, normalizeGeneratedPrompts } from "./promptQuality.ts";
import {
  highestPaidPlan,
  isBlockingSubscriptionStatus,
  isEntitlingSubscriptionStatus,
  planChangeDirection,
  validateCheckoutPrice,
} from "./billingPolicy.ts";
import { weeklyDigestEmail } from "./emailTemplates.ts";
import { welcomeEmail, welcomeD3Email, welcomeD7Email, auditCompleteEmail, simulationCompleteEmail, aeoInsightsEmail, paymentFailedEmail, cardExpiringEmail, scoreChangedEmail } from "./emailTemplates.ts";

test("onboarding gives stage-appropriate actions without full-access promises", () => {
  const first = welcomeEmail("<b>Test</b>", "https://example.com/unsubscribe");
  assert.ok(first.html.includes("&lt;b&gt;Test&lt;/b&gt;"));
  assert.ok(first.html.includes("https://example.com/unsubscribe"));
  assert.match(first.text, /No Google connection or tracking snippet/);
  assert.match(welcomeD3Email("Test", false).text, /entering one website URL/);
  assert.match(welcomeD3Email("Test", true).text, /unfinished recommendation/);
  assert.match(welcomeD7Email("Test").text, /no automatic charge/);
  assert.doesNotMatch(first.html, /full-access|everything.*unlocked/);
});

test("email links have safe missing-audit fallbacks and correct billing destination", () => {
  for (const email of [auditCompleteEmail("Test", "https://example.com", 50, null), simulationCompleteEmail("Test", "example.com", 50, null)]) {
    assert.doesNotMatch(email.html, /\/dashboard|\/simulate\/"/);
    assert.doesNotMatch(email.text, /\/dashboard/);
  }
  for (const email of [paymentFailedEmail("Test", 1), cardExpiringEmail("Test", "1234", 12, 2030)]) {
    assert.ok(email.html.includes("https://aeoimprovement.com/upgrade"));
    assert.ok(email.text.includes("https://aeoimprovement.com/upgrade"));
  }
});

test("educational and score emails distinguish guidance from measured outcomes", () => {
  for (let week = 0; week < 6; week++) {
    const email = aeoInsightsEmail("Test", week);
    assert.doesNotMatch(email.html + email.text + email.subject, /—|highest-ROI|guaranteed lift/);
    assert.match(email.text, /Top actions/);
  }
  assert.match(scoreChangedEmail("Test", "https://example.com", 50, 70, null, "42").text, /not proof/);
});
import { selectStripeCustomerCandidate } from "./billingCustomerSelection.ts";
import { billingWebhookEvents } from "./stripeWebhookPolicy.ts";
import { safeBaseUrl } from "./publicUrl.ts";
import { getBillingSubscription } from "./billingSubscription.ts";

test("billing lookup expands only the selected subscription within Stripe's depth limit", async () => {
  const calls: unknown[] = [];
  const expected = { id: "sub_active", status: "active" };
  const stripe = { subscriptions: {
    list: async (params: any) => {
      assert.equal(params.expand, undefined);
      assert.equal(params.customer, "cus_test");
      return { data: [{ id: "sub_old", status: "canceled" }, expected] };
    },
    retrieve: async (id: string, params: any) => {
      calls.push(id);
      assert.deepEqual(params.expand, ["items.data.price.product"]);
      assert.ok(params.expand.every((path: string) => path.split(".").length <= 4));
      return expected;
    },
  } };
  assert.equal(await getBillingSubscription(stripe as any, "cus_test"), expected);
  assert.deepEqual(calls, ["sub_active"]);
});

test("billing lookup preserves no-subscription and provider-failure states", async () => {
  const stripe = { subscriptions: {
    list: async () => ({ data: [{ status: "canceled" }] }),
    retrieve: async () => { throw new Error("must not retrieve"); },
  } };
  assert.equal(await getBillingSubscription(stripe as any, "cus_test"), null);
  stripe.subscriptions.list = async () => { throw new Error("provider unavailable"); };
  await assert.rejects(getBillingSubscription(stripe as any, "cus_test"), /provider unavailable/);
});

test("Stripe return URLs preserve the verified public custom domain", () => {
  const previousReplitDomains = process.env.REPLIT_DOMAINS;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.REPLIT_DOMAINS = "geo-seo-claude-example.replit.app";
  process.env.NODE_ENV = "production";

  try {
    const req = {
      protocol: "https",
      get(name: string) {
        if (name === "x-forwarded-host") return "aeoimprovement.com";
        if (name === "x-forwarded-proto") return "https";
        return undefined;
      },
    };

    assert.equal(safeBaseUrl(req as any), "https://aeoimprovement.com");

    const proxiedReq = {
      protocol: "https",
      get(name: string) {
        if (name === "x-forwarded-host") return "geo-seo-claude-example.replit.app";
        if (name === "x-forwarded-proto") return "https";
        return undefined;
      },
    };

    assert.equal(safeBaseUrl(proxiedReq as any), "https://aeoimprovement.com");
  } finally {
    if (previousReplitDomains === undefined) delete process.env.REPLIT_DOMAINS;
    else process.env.REPLIT_DOMAINS = previousReplitDomains;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});

test("paid weekly digest points to the user's next task and program status", () => {
  const email = weeklyDigestEmail({
    firstName: "Jamie",
    planName: "Pro",
    auditCount: 2,
    latestAudit: {
      id: 42,
      url: "https://example.com/",
      geoScore: 61,
      previousGeoScore: 55,
      quickWins: [],
      nextAction: { title: "Add first-party evidence", detail: "Document one example you can support." },
      completedActions: 3,
      createdAt: new Date("2026-09-01T12:00:00Z"),
    },
    tracking: { activeKeywords: 5, rankedKeywords: 4, pendingKeywords: 1 },
    monitoring: { activeSites: 1, waitingForFirstRun: 0 },
    googleMeasurementConnected: true,
  });

  assert.equal(email.subject, "Your SEO + GEO task for example.com");
  assert.match(email.html, /Implementation references:/);
  assert.match(email.text, /Implementation references:/);
  assert.match(email.html, /creating-helpful-content/);
  assert.match(email.text, /reviewed 2026-09-05/);
  assert.match(email.html, /\/results\/42#recommendations/);
  assert.match(email.html, /Add first-party evidence/);
  assert.match(email.html, /Keywords with a rank baseline/);
  assert.match(email.text, /Active keyword targets: 5/);
  assert.match(email.text, /1 await first collection/);
  assert.match(email.text, /Traffic and ranking changes do not prove causation/);
  assert.match(email.html, /Review collection status and history/);
});

test("paid weekly digest escapes recommendation content before rendering HTML", () => {
  const email = weeklyDigestEmail({
    firstName: "<Jamie>",
    auditCount: 0,
    latestAudit: {
      id: 7,
      url: "https://example.com/",
      geoScore: 50,
      quickWins: [],
      nextAction: { id: "evidence&method", title: "Add <evidence>", detail: "Use <script>alert(1)</script> nowhere." },
      createdAt: new Date("2026-09-01T12:00:00Z"),
    },
  });

  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /Add &lt;evidence&gt;/);
  assert.match(email.html, /Hi &lt;Jamie&gt;/);
  assert.ok(email.html.includes("/results/7?task=evidence%26method#recommendations"));
  assert.ok(email.text.includes("/results/7?task=evidence%26method#recommendations"));
});

test("Starter weekly digest guides audit work without promising connected SEO tracking", () => {
  const email = weeklyDigestEmail({
    firstName: "Jamie",
    planName: "Starter",
    paidSeoEnabled: false,
    auditCount: 1,
  });

  assert.match(email.html, /Create your SEO and GEO baseline/);
  assert.doesNotMatch(email.html, /Active keyword targets/);
  assert.doesNotMatch(email.html, /connect Search Console and GA4/);
  assert.doesNotMatch(email.text, /Keywords with a rank baseline/);
});

test("limits provider-backed SEO tracking to paid Pro and Agency plans", () => {
  assert.equal(isPaidSeoPlan("free"), false);
  assert.equal(isPaidSeoPlan("starter"), false);
  assert.equal(isPaidSeoPlan("pro"), true);
  assert.equal(isPaidSeoPlan("agency"), true);
});

test("normalizes generated suggestions into complete buyer questions", () => {
  assert.equal(
    normalizeGeneratedPromptLine("How to hire a performance marketing agency for Google and Meta ads"),
    "How can I hire a performance marketing agency for Google and Meta ads?",
  );
  assert.equal(
    normalizeGeneratedPromptLine("In-house paid media team vs hiring performance marketing agency pros and cons"),
    "Should I choose in-house paid media team or hire a performance marketing agency?",
  );
  assert.equal(
    normalizeGeneratedPromptLine("Set up Google, Meta, TikTok ads and affiliate program for scaling ecommerce"),
    "Who can help me set up Google, Meta, TikTok ads and affiliate program for scaling ecommerce?",
  );
  assert.deepEqual(normalizeGeneratedPrompts("Best AEO tools for agencies\nBest AEO tools for agencies"), [
    "What are the best AEO tools for agencies?",
  ]);
});

test("filters answer headings and keeps plausible company names", () => {
  for (const heading of [
    "Goal",
    "Primary KPI",
    "Constraints",
    "Performance Max (PMax",
    "Your offer + funnel",
    "Testing / sprint",
    "Ongoing management",
    "Cross-channel",
  ]) {
    assert.equal(looksLikeCompetitorBrand(heading), false, `${heading} is structural text, not a brand`);
  }
  assert.equal(looksLikeCompetitorBrand("WebFX"), true);
  assert.equal(looksLikeCompetitorBrand("Disruptive Advertising"), true);
  assert.deepEqual(
    extractCompetitorBrandsFromText(
      "**Goal** **Primary KPI** **WebFX** **Performance Max (PMax)** **Disruptive Advertising**",
      "Experience Advertising",
    ),
    ["WebFX", "Disruptive Advertising"],
  );
});

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

test("legacy Stripe customer recovery is exact or unambiguous", () => {
  const candidates = [
    { id: "cus_old", metadataUserId: "old-user", hasBlockingSubscription: true },
  ];
  assert.equal(selectStripeCustomerCandidate(candidates, "new-user", true), "cus_old");
  assert.equal(selectStripeCustomerCandidate([
    ...candidates,
    { id: "cus_other", metadataUserId: null, hasBlockingSubscription: true },
  ], "new-user", true), null);
  assert.equal(selectStripeCustomerCandidate([
    { id: "cus_exact", metadataUserId: "new-user", hasBlockingSubscription: false },
    { id: "cus_other", metadataUserId: null, hasBlockingSubscription: true },
  ], "new-user", false), "cus_exact");
});

test("managed Stripe webhooks exclude unsupported upcoming invoice previews", () => {
  assert.deepEqual(
    billingWebhookEvents(["checkout.session.completed", "invoice.upcoming", "invoice.payment_succeeded"]),
    ["checkout.session.completed", "invoice.payment_succeeded"],
  );
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
