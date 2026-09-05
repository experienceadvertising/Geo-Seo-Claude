import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { createHmac } from "node:crypto";
import { schedulerHttp } from "./schedulerHttp.ts";

test("HTTP scheduler rejects unauthorized calls and supports a side-effect-free signed probe", async () => {
  const originalSecret = process.env.SCHEDULER_SECRET;
  const originalMode = process.env.SCHEDULER_MODE;
  const secret = "c".repeat(64);
  process.env.SCHEDULER_SECRET = secret;
  process.env.SCHEDULER_MODE = "disabled";
  const app = express();
  app.post("/api/internal/scheduler", express.raw({ type: "application/json", limit: "4kb" }), schedulerHttp);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const url = `http://127.0.0.1:${address.port}/api/internal/scheduler`;
  const call = (body: string, timestamp = String(Date.now()), valid = true) => fetch(url, {
    method: "POST", body, headers: {
      "content-type": "application/json", "x-scheduler-timestamp": timestamp,
      "x-scheduler-signature": valid ? createHmac("sha256", secret).update(`${timestamp}\nPOST\n/api/internal/scheduler\n${body}`).digest("hex") : "bad",
    },
  });
  try {
    assert.equal((await call('{"operation":"probe"}', undefined, false)).status, 401);
    assert.equal((await call('{"operation":"probe"}', String(Date.now() - 360000))).status, 401);
    assert.deepEqual(await (await call('{"operation":"probe"}')).json(), { status: "ready", protocol: 1 });
    assert.equal((await call('{"operation":"run-due"}')).status, 503);
    assert.equal((await call('{"operation":"other"}')).status, 400);
    assert.equal((await call('{"operation":"probe","userId":"untrusted"}')).status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    if (originalSecret === undefined) delete process.env.SCHEDULER_SECRET; else process.env.SCHEDULER_SECRET = originalSecret;
    if (originalMode === undefined) delete process.env.SCHEDULER_MODE; else process.env.SCHEDULER_MODE = originalMode;
  }
});
