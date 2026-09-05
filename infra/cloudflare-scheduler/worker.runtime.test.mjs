import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Use Miniflare directly or point MINIFLARE_MODULE at Wrangler's bundled module.
// All outbound traffic is intercepted. No production secrets or requests occur.
const { Miniflare, convertV4MiniflareOptions } = await import(process.env.MINIFLARE_MODULE || "miniflare");
const source = readFileSync(new URL("./worker.mjs", import.meta.url), "utf8")
  .replace("export default {", "const originalHandler = {");
const script = `${source}
export default {
  async fetch(request, env) {
    try { return Response.json(await trigger(env)); }
    catch { return Response.json({ status: "rejected" }, { status: 503 }); }
  }
};`;

async function withRuntime(outboundService, check) {
  const options = {
    modules: true, compatibilityDate: "2026-09-04", script,
    bindings: { SCHEDULER_ENABLED: "true", SCHEDULER_SECRET: "0".repeat(64) },
    outboundService,
  };
  const runtime = new Miniflare(convertV4MiniflareOptions ? convertV4MiniflareOptions(options) : options);
  try { await check(await runtime.dispatchFetch("http://localhost/test")); }
  finally { await runtime.dispose(); }
}

test("Cloudflare runtime accepts the signed request and confirms completion", async () => {
  let calls = 0;
  await withRuntime(async request => {
    calls++;
    assert.equal(request.url, "https://aeoimprovement.com/api/internal/scheduler");
    assert.equal(request.method, "POST");
    assert.match(request.headers.get("x-scheduler-signature"), /^[a-f0-9]{64}$/);
    assert.deepEqual(await request.json(), { operation: "run-due" });
    return Response.json({ status: "completed", more: false });
  }, async response => {
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "completed" });
  });
  assert.equal(calls, 1);
});

test("Cloudflare runtime does not follow redirects or retry uncertain work", async () => {
  let calls = 0;
  await withRuntime(async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: "https://example.invalid/" } });
  }, async response => {
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { status: "rejected" });
  });
  assert.equal(calls, 1);
});
