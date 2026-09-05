// This Worker holds only a dedicated scheduler secret, never app/provider keys.
const endpoint = "https://aeoimprovement.com/api/internal/scheduler";

export async function signedHeaders(secret, body, now = Date.now()) {
  if (!/^[a-f0-9]{64}$/.test(secret || "")) throw new Error("Missing scheduler configuration");
  const timestamp = String(now);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}\nPOST\n/api/internal/scheduler\n${body}`));
  return {
    "content-type": "application/json",
    "x-scheduler-timestamp": timestamp,
    "x-scheduler-signature": Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, "0")).join(""),
  };
}

export async function trigger(env, request = fetch) {
  if (env.SCHEDULER_ENABLED !== "true") return { status: "disabled" };
  const body = JSON.stringify({ operation: "run-due" });
  // Never follow a redirect carrying this authenticated request to another host.
  // A timeout is uncertain completion, not permission to replay email sends.
  try {
    const started = Date.now();
    for (let step = 0; step < 40 && Date.now() - started < 600_000; step++) {
    const headers = await signedHeaders(env.SCHEDULER_SECRET, body);
    const response = await request(endpoint, {
      method: "POST", headers, body, redirect: "error",
      signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok) throw new Error("Scheduler request failed");
    const result = await response.json();
    if (result?.status !== "completed" && result?.status !== "idle") {
      throw new Error("Scheduler completion not confirmed");
    }
    if (!result.more) return { status: result.status };
    }
    return { status: "batch-limit-reached" };
  } catch {
    // Do not log response bodies, secret headers, or provider/customer payloads.
    throw new Error("Scheduler request failed or completion is uncertain; inspect the job ledger before retrying");
  }
}

export default {
  fetch() { return new Response("Not found", { status: 404 }); },
  async scheduled(_event, env) {
    const result = await trigger(env);
    console.log(JSON.stringify({ component: "aeo-scheduler", status: result.status }));
  },
};
