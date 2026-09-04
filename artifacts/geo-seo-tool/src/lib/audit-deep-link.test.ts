import test from "node:test";
import assert from "node:assert/strict";
import { getAuditDeepLinkState } from "./audit-deep-link.ts";

test("recognizes each supported audit sidebar section", () => {
  for (const targetId of ["recommendations", "seo-opportunities", "technical-breakdown"]) {
    assert.deepEqual(getAuditDeepLinkState("", `#${targetId}`), {
      showTechnicalDetails: false,
      targetId,
    });
  }
});

test("opens technical details when requested in the query", () => {
  assert.deepEqual(getAuditDeepLinkState("?details=1", "#technical-breakdown"), {
    showTechnicalDetails: true,
    targetId: "technical-breakdown",
  });
});

test("ignores unsupported hashes", () => {
  assert.deepEqual(getAuditDeepLinkState("?details=0", "#missing-section"), {
    showTechnicalDetails: false,
    targetId: null,
  });
});
