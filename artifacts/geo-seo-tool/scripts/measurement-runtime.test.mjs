import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
for (const [project, file, key, choice] of [
  [
    "aeo-measurement-release",
    "artifacts/geo-seo-tool/src/lib/analytics.ts",
    "aeo.trackingConsent",
    "all",
  ],
]) {
  function runtime(gpc = false) {
    const storage = new Map();
    const nodes = new Map();
    const win = {
      location: {
        pathname: "/privacy",
        search: "?email=private@example.com",
        href: "https://example.com/privacy?email=private@example.com",
        origin: "https://example.com",
      },
      localStorage: {
        getItem: (k) => storage.get(k) || null,
        setItem: (k, v) => storage.set(k, v),
      },
      dispatchEvent() {},
    };
    const ctx = {
      exports: {},
      window: win,
      navigator: { globalPrivacyControl: gpc },
      document: {
        title: "Privacy",
        referrer: "https://example.com/?token=secret",
        getElementById: (k) => nodes.get(k),
        createElement: () => ({}),
        head: { appendChild: (n) => nodes.set(n.id, n) },
      },
      CustomEvent: class {},
      URLSearchParams,
      URL,
      Date,
    };
    let source = fs
      .readFileSync(new URL("../../../" + file, import.meta.url), "utf8")
      .replaceAll("import.meta.env", "({PROD:true})");
    vm.runInNewContext(
      ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS },
      }).outputText,
      ctx,
    );
    return { api: ctx.exports, win, nodes };
  }
  test(project + " consent, PII, dedup and GPC", () => {
    let r = runtime();
    r.api.initializeAnalytics();
    assert.equal(r.nodes.size, 0);
    r.api.setTrackingConsent(choice);
    r.api.trackPageView("/privacy?email=private@example.com");
    r.api.trackPageView("/privacy?email=other@example.com");
    r.api.trackEvent("sign_up", {
      method: "email",
      email: "private@example.com",
      page_location: "https://evil.com/?token=secret",
      source: "private@example.com",
    });
    assert.ok(
      r.win.dataLayer.every(
        (v) => Object.prototype.toString.call(v) === "[object Arguments]",
      ),
    );
    const calls = r.win.dataLayer.map((v) => Array.from(v));
    assert.equal(calls.filter((v) => v[1] === "page_view").length, 1);
    const event = calls.find((v) => v[1] === "sign_up");
    assert.equal(event[2].method, "email");
    assert.equal(event[2].email, undefined);
    assert.equal(event[2].page_location, "https://example.com/privacy");
    assert.ok(!JSON.stringify(calls).includes("private@example.com"));
    r.win.gtag = () => {
      throw new Error("vendor blocked");
    };
    assert.doesNotThrow(() => r.api.trackEvent("sign_up", { method: "email" }));
    assert.ok(
      calls.every(
        (v) => Object.prototype.toString.call(v) === "[object Array]",
      ),
    );
    r = runtime(true);
    r.api.setTrackingConsent(choice);
    r.api.trackEvent("sign_up");
    assert.equal(r.nodes.size, 0);
    assert.equal(
      r.win.dataLayer.map((v) => Array.from(v)).filter((v) => v[0] === "event")
        .length,
      0,
    );
  });
}

test("accepted registration contract rejects false success", () => {
  const ctx = { exports: {}, URL };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        new URL(
          "../../../artifacts/geo-seo-tool/src/lib/accepted-registration.ts",
          import.meta.url,
        ),
        "utf8",
      ),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } },
    ).outputText,
    ctx,
  );
  for (const rejected of [
    null,
    {},
    true,
    { accepted: "true" },
    { accepted: false },
  ])
    assert.equal(ctx.exports.isAcceptedRegistration(rejected), false);
  assert.equal(ctx.exports.isAcceptedRegistration({ accepted: true }), true);
  for (const rejected of [
    null,
    {},
    { url: "https://example.com/pay" },
    { url: "javascript:alert(1)" },
    { url: "http://checkout.stripe.com/pay" },
    { url: "https://user:pass@checkout.stripe.com/pay" },
  ])
    assert.equal(ctx.exports.acceptedCheckoutUrl(rejected), null);
  assert.equal(
    ctx.exports.acceptedCheckoutUrl({
      url: "https://checkout.stripe.com/pay/cs_example",
    }),
    "https://checkout.stripe.com/pay/cs_example",
  );
});

test("actual checkout callers reject failures and preserve redirect when analytics throws", async () => {
  const aeo = import.meta.url.includes("geo-seo-tool");
  const prefix = aeo ? "../../../" : "../";
  const accepted = { exports: {}, URL };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(
        new URL(
          prefix +
            (aeo ? "artifacts/geo-seo-tool/src/lib/" : "client/src/lib/") +
            "accepted-registration.ts",
          import.meta.url,
        ),
        "utf8",
      ),
      { compilerOptions: { module: ts.ModuleKind.CommonJS } },
    ).outputText,
    accepted,
  );
  let outcome = {
    url: "https://checkout.stripe.com/pay/cs_example?opaque=example",
  };
  let reject = false;
  let throws = false;
  const events = [];
  const redirects = [];
  const ctx = {
    exports: {},
    URL,
    Error,
    document: { cookie: "" },
    window: { location: { assign: (url) => redirects.push(url) } },
    require: (name) => {
      if (name.includes("accepted-registration")) return accepted.exports;
      if (name.includes("queryClient")) return {};
      if (name.includes("api-client-react"))
        return {
          customFetch: async () => {
            if (reject) throw new Error("HTTP 503");
            return outcome;
          },
        };
      if (name.includes("react-query"))
        return { useMutation: (options) => options, useQuery: () => ({}) };
      if (name.includes("use-toast"))
        return { useToast: () => ({ toast() {} }) };
      if (name.includes("AuthContext")) return {};
      if (name.includes("analytics"))
        return {
          trackEvent: (...args) => {
            if (throws) throw new Error("blocked vendor");
            events.push(args);
          },
        };
      throw new Error("Unexpected import " + name);
    },
    fetch: async () => ({
      ok: !reject,
      json: async () => (reject ? { error: "HTTP 503" } : outcome),
    }),
  };
  if (aeo) {
    vm.runInNewContext(
      ts.transpileModule(
        fs.readFileSync(
          new URL(
            prefix + "artifacts/geo-seo-tool/src/hooks/useStripe.ts",
            import.meta.url,
          ),
          "utf8",
        ),
        { compilerOptions: { module: ts.ModuleKind.CommonJS } },
      ).outputText,
      ctx,
    );
    const hook = ctx.exports.useCheckout();
    reject = true;
    await assert.rejects(
      hook.mutationFn({ priceId: "price_example", plan: "pro" }),
    );
    assert.equal(events.length, 0);
    reject = false;
    outcome = { url: "https://example.com/pay" };
    await assert.rejects(
      hook.mutationFn({ priceId: "price_example", plan: "pro" }),
    );
    outcome = {
      url: "https://checkout.stripe.com/pay/cs_example?opaque=example",
    };
    const result = await hook.mutationFn({
      priceId: "price_example",
      plan: "pro",
    });
    throws = true;
    assert.doesNotThrow(() =>
      hook.onSuccess(result, { plan: "pro", billingInterval: "month" }),
    );
    assert.equal(ctx.window.location.href, outcome.url);
    throws = false;
    hook.onSuccess(result, { plan: "pro", billingInterval: "month" });
    assert.equal(events[0][0], "checkout_started");
    assert.ok(!JSON.stringify(events).includes("cs_example"));
  } else {
    vm.runInNewContext(
      ts.transpileModule(
        fs.readFileSync(
          new URL(prefix + "client/src/lib/api.ts", import.meta.url),
          "utf8",
        ),
        { compilerOptions: { module: ts.ModuleKind.CommonJS } },
      ).outputText,
      ctx,
    );
    const source = fs.readFileSync(
      new URL(
        prefix + "client/src/components/PricingSection.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    const ast = ts.createSourceFile(
      "Pricing.tsx",
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    let handler;
    function walk(n) {
      if (
        ts.isVariableDeclaration(n) &&
        n.name.getText(ast) === "handleUpgrade"
      )
        handler = n.initializer.getText(ast);
      ts.forEachChild(n, walk);
    }
    walk(ast);
    assert.ok(handler);
    Object.assign(ctx, {
      getSession: () => ({ userId: "local-saved" }),
      selectedPrice: { id: "price_example", currency: "usd", amount: 2900 },
      interval: "month",
      setCheckoutLoading() {},
      toast() {},
      setLocation() {},
      createCheckoutSession: ctx.exports.createCheckoutSession,
      trackEvent: (...args) => {
        if (throws) throw new Error("blocked vendor");
        events.push(args);
      },
    });
    vm.runInNewContext(
      "this.run=" +
        ts.transpileModule(handler, {
          compilerOptions: { target: ts.ScriptTarget.ES2022 },
        }).outputText,
      ctx,
    );
    reject = true;
    await ctx.run();
    assert.equal(events.length, 0);
    assert.equal(redirects.length, 0);
    reject = false;
    outcome = {};
    await ctx.run();
    assert.equal(events.length, 0);
    outcome = {
      url: "https://checkout.stripe.com/pay/cs_example?opaque=example",
    };
    throws = true;
    await ctx.run();
    assert.deepEqual(redirects, [outcome.url]);
    throws = false;
    await ctx.run();
    assert.equal(events[0][0], "begin_checkout");
    assert.ok(!JSON.stringify(events).includes("cs_example"));
  }
});
