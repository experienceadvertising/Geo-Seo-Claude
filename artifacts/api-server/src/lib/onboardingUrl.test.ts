import assert from "node:assert/strict";
import test from "node:test";
import { onboardingUrl } from "./onboardingUrl.ts";
test("onboarding URLs preserve page context without credentials or fragments", () => {
  assert.equal(onboardingUrl("example.com/services#pricing"), "https://example.com/services");
  assert.equal(onboardingUrl("https://example.com/page?q=one"), "https://example.com/page?q=one");
  for (const value of [null, {}, "", "javascript:alert(1)", "https://user:pass@example.com", "http://localhost", "x".repeat(2049)]) assert.equal(onboardingUrl(value), null);
});
