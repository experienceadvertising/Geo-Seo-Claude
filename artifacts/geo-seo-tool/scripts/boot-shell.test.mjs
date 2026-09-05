import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { bootHead, bootStatus } from "./boot-shell.mjs";

test("pre-paint gate affects only static content, not the rendered app", () => {
  assert.match(bootHead, /html\.app-booting #root>\[data-static-route\]/);
  assert.match(bootStatus, /role="status"/);
  assert.match(bootHead, /#app-boot-status\{display:none\}/);
  assert.doesNotMatch(bootHead, /userAgent|Googlebot|GPTBot/);
});

test("failed JavaScript loading restores the readable static page", () => {
  const classes = new Set();
  let recover;
  const script = bootHead.match(/<script data-app-boot>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, {
    document: { documentElement: { classList: {
      add: value => classes.add(value), remove: value => classes.delete(value),
    } } },
    setTimeout(callback, delay) { assert.equal(delay, 8000); recover = callback; },
  });
  assert.equal(classes.has("app-booting"), true);
  recover();
  assert.equal(classes.has("app-booting"), false);
});
