import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const fs = require("node:fs");
const vm = require("node:vm");

const { test } = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

for (const [project, file, key, choice] of [
  [
    "AEO",
    "artifacts/geo-seo-tool/src/lib/analytics.ts",
    "aeo.trackingConsent",
    "all",
  ],
]) {
  function fixture({ block, gpc = false, granted = true } = {}) {
    const calls = [],
      nodes = new Map();
    const ctx = {
      exports: {},
      window: {
        location: {
          origin: "https://example.test",
          pathname: "/unknown/private@example.test",
          search: "?email=private@example.test",
          href: "https://example.test/unknown/private@example.test?email=private@example.test",
        },
        localStorage: {
          getItem: (k) =>
            k === key
              ? JSON.stringify({ analytics: granted, ads: granted })
              : null,
          setItem() {
            if (block === "storage") throw Error("blocked storage");
          },
        },
        dispatchEvent() {},
        gtag: (...args) => calls.push(args),
      },
      document: {
        title: "Public",
        referrer: "https://private.example.test/?email=private@example.test",
        getElementById: (id) => nodes.get(id),
        createElement() {
          if (block === "create") throw Error("blocked create");
          return {};
        },
        head: {
          appendChild(node) {
            if (block === "script") throw Error("blocked script");
            nodes.set(node.id, node);
          },
        },
      },
      navigator: { globalPrivacyControl: gpc },
      CustomEvent: class {},
      URL,
      URLSearchParams,
      Date,
    };
    const source = fs
      .readFileSync(new URL("../../../" + file, import.meta.url), "utf8")
      .replaceAll("import.meta.env", "({PROD:true})");
    vm.runInNewContext(
      ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
      }).outputText,
      ctx,
    );
    return { api: ctx.exports, ctx, calls, nodes };
  }
  test(
    project + " DOM insertion failure cannot interrupt signup or pageview",
    () => {
      for (const block of ["script", "create"]) {
        const r = fixture({ block });
        assert.doesNotThrow(() => r.api.trackEvent("sign_up_started"));
        assert.doesNotThrow(() => r.api.trackPageView("/privacy"));
        assert.doesNotThrow(() => r.api.setTrackingConsent(choice));
      }
    },
  );
  test(
    project +
      " current denial wins over an old grant when storage cannot write",
    () => {
      const r = fixture({ block: "storage" });
      r.api.setTrackingConsent("essential");
      assert.equal(r.api.getTrackingConsent().analytics, false);
      r.api.trackEvent("sign_up");
      r.api.trackPageView("/privacy");
      assert.equal(r.calls.filter((call) => call[0] === "event").length, 0);
    },
  );
  test(
    project +
      " unknown private paths and query/referrer PII do not enter telemetry",
    () => {
      const r = fixture();
      r.api.trackEvent("sign_up", {
        email: "private@example.test",
        page_location: "https://evil.test/?token=secret",
        source: "private@example.test",
      });
      r.api.trackPageView(
        "/unknown/private@example.test?email=private@example.test",
      );
      const serialized = JSON.stringify(r.calls);
      assert.ok(!serialized.includes("private@example.test"));
      assert.ok(!serialized.includes("?email="));
      assert.ok(!serialized.includes("evil.test"));
      assert.ok(!serialized.includes("private.example.test"));
    },
  );
  test(
    project + " GPC and saved denial block all analytics events and scripts",
    () => {
      for (const options of [{ gpc: true }, { granted: false }]) {
        const r = fixture(options);
        r.api.trackEvent("sign_up");
        r.api.trackPageView("/privacy");
        assert.equal(r.nodes.size, 0);
        assert.equal(r.calls.filter((call) => call[0] === "event").length, 0);
      }
    },
  );
}
