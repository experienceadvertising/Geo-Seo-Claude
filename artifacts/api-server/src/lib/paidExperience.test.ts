import test from "node:test";
import assert from "node:assert/strict";
import { progressApplies, recommendationPageKey, currentRecommendationCopy, selectPersonalizedAction } from "@workspace/recommendations";
import { withDeliveryAudit, recordDelivery } from "./deliveryAudit.ts";
import { pushCategoryEnabled, weeklyStrategyPush } from "./pushPayload.ts";
import { weeklyDigestEmail, aeoInsightTopic, aeoInsightsEmail } from "./emailTemplates.ts";

test("page completion does not suppress another page or guess legacy scope", () => {
  const row = { recommendationId: "direct-answer-block", pageUrl: "https://www.example.com/services/" };
  assert.equal(progressApplies(row, "https://example.com/services"), true);
  assert.equal(progressApplies(row, "https://example.com/"), false);
  assert.equal(progressApplies({ ...row, pageUrl: "" }, "https://example.com/services"), false);
  assert.equal(progressApplies({ recommendationId: "offsite:brand-profile", pageUrl: "" }, "https://example.com/about"), true);
  assert.notEqual(recommendationPageKey("https://example.com/a?lang=en"), recommendationPageKey("https://example.com/a?lang=fr"));
  assert.throws(() => recommendationPageKey("javascript:alert(1)"));
});
test("delivery failures are not completed, and accepted channels are not replayed", async () => {
  let calls = 0;
  const outcomes: unknown[] = [];
  await assert.rejects(withDeliveryAudit(async () => { calls++; recordDelivery("email", "accepted"); recordDelivery("push", "uncertain"); }, rows => { outcomes.push(...rows); }), /requires review/);
  assert.equal(calls, 1);
  assert.deepEqual(outcomes, [{ channel: "email", outcome: "accepted" }, { channel: "push", outcome: "uncertain" }]);
  await withDeliveryAudit(async () => recordDelivery("push", "expired"));
});
test("push preferences are independent by category", () => {
  const preferences = { tasksEnabled: true, monitoringEnabled: false, strategiesEnabled: false };
  assert.equal(pushCategoryEnabled("weekly-task-1", preferences), true);
  assert.equal(pushCategoryEnabled("audit-1", preferences), true);
  assert.equal(pushCategoryEnabled("score-change-1", preferences), false);
  assert.equal(pushCategoryEnabled("weekly-strategy-36", preferences), false);
});
test("evergreen strategies deep link to a guide or matching unfinished task", () => {
  const topic = aeoInsightTopic(1);
  assert.equal(weeklyStrategyPush(topic, 1).url, "/show-first-party-experience-seo");
  const task = { url: "/actions/1?task=first-party-data#recommendations", title: "Add real evidence" };
  assert.equal(weeklyStrategyPush(topic, 1, task).url, task.url);
  const email = aeoInsightsEmail("Tester", 1);
  assert.match(email.html, /Evergreen strategy reminder/);
  assert.match(email.html, /show-first-party-experience-seo/);
});
test("weekly report keeps separate client tasks and avoids injecting client content", () => {
  const email = weeklyDigestEmail({ firstName: "Tester", auditCount: 2, paidSeoEnabled: true, clientSummaries: [
    { auditId: 1, url: "https://one.example/", nextTask: { id: "direct-answer-block", title: "Answer buyers <script>" }, activeKeywords: 2, collectedKeywords: 1, staleKeywords: 0 },
    { auditId: 2, url: "https://two.example/about", nextTask: { id: "first-party-data", title: "Add evidence" }, activeKeywords: 4, collectedKeywords: 3, staleKeywords: 1 },
  ] });
  assert.match(email.html, /actions\/1\?task=direct-answer-block/);
  assert.match(email.html, /actions\/2\?task=first-party-data/);
  assert.match(email.text, /two.example/);
  assert.doesNotMatch(email.html, /<script>/);
});
test("legacy freshness language is corrected before prioritization", () => {
  const legacy = { id: "current-year-stats", priority: "high", title: "Cite this year", detail: "AI heavily favors recent data" };
  assert.equal(currentRecommendationCopy(legacy).priority, "medium");
  assert.doesNotMatch(selectPersonalizedAction([legacy], new Set())!.detail, /heavily favors/);
  assert.match(currentRecommendationCopy(legacy).detail, /keep older evidence/);
});
