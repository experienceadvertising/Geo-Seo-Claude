import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifySchedulerRequest } from "./schedulerRequestAuth.ts";

const secret = "b".repeat(64); // Test fixture, not a deployment credential.
const now = 1788566400000;
const body = '{"operation":"run-due"}';
const sign = (timestamp = String(now), message = body) => createHmac("sha256", secret).update(`${timestamp}\nPOST\n/api/internal/scheduler\n${message}`).digest("hex");

test("valid scheduler signature is accepted", () => {
  assert.equal(verifySchedulerRequest(secret, String(now), sign(), body, now), true);
});
test("missing, malformed and incorrect credentials fail closed", () => {
  assert.equal(verifySchedulerRequest(undefined, String(now), sign(), body, now), false);
  assert.equal(verifySchedulerRequest(secret, undefined, sign(), body, now), false);
  for (const signature of [undefined, "", "z".repeat(64), "a".repeat(64), "a".repeat(63)]) {
    assert.equal(verifySchedulerRequest(secret, String(now), signature, body, now), false);
  }
});
test("expired and future requests are rejected", () => {
  for (const offset of [-300001, 300001]) {
    const timestamp = String(now + offset);
    assert.equal(verifySchedulerRequest(secret, timestamp, sign(timestamp), body, now), false);
  }
});
test("tampering, oversized bodies and invalid clocks are rejected", () => {
  assert.equal(verifySchedulerRequest(secret, String(now), sign(), '{"operation":"other"}', now), false);
  assert.equal(verifySchedulerRequest(secret, String(now), sign(), body, NaN), false);
  const oversized = "x".repeat(4097);
  assert.equal(verifySchedulerRequest(secret, String(now), sign(String(now), oversized), oversized, now), false);
});
