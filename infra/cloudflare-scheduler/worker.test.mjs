import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import worker, { signedHeaders, trigger } from "./worker.mjs";

const secret = "a".repeat(64); // Fixture only, not a deployment credential.
test("disabled Worker does not request the app or require a secret", async () => {
  assert.deepEqual(await trigger({}, () => { throw new Error("unexpected request"); }), { status: "disabled" });
});
test("public requests never trigger jobs", async () => {
  assert.equal(worker.fetch().status, 404);
});
test("signature binds timestamp, method, endpoint and exact body", async () => {
  const body = '{"operation":"run-due"}';
  const headers = await signedHeaders(secret, body, 12345);
  assert.equal(headers["x-scheduler-signature"], createHmac("sha256", secret).update(`12345\nPOST\n/api/internal/scheduler\n${body}`).digest("hex"));
  await assert.rejects(signedHeaders("", body), /configuration/);
});
test("confirmed requests have fixed destination and cannot follow redirects", async () => {
  const result = await trigger({ SCHEDULER_ENABLED: "true", SCHEDULER_SECRET: secret }, async (url, options) => {
    assert.equal(url, "https://aeoimprovement.com/api/internal/scheduler");
    assert.equal(options.redirect, "error");
    assert.equal(options.method, "POST");
    return Response.json({ status: "completed" });
  });
  assert.deepEqual(result, { status: "completed" });
});
test("failed or unconfirmed responses are sanitized and never retried", async () => {
  for (const response of [new Response("private payload", { status: 500 }), Response.json({ status: "queued" }), new Response("not json")]) {
    let calls = 0;
    await assert.rejects(trigger({ SCHEDULER_ENABLED: "true", SCHEDULER_SECRET: secret }, async () => { calls++; return response; }), /completion is uncertain/);
    assert.equal(calls, 1);
  }
});
test("one tick has a hard cap of 40 requests even when backlog remains", async () => {
  let calls = 0;
  const result = await trigger({ SCHEDULER_ENABLED: "true", SCHEDULER_SECRET: secret }, async () => { calls++; return Response.json({ status: "completed", more: true }); });
  assert.equal(calls, 40);
  assert.deepEqual(result, { status: "batch-limit-reached" });
});
