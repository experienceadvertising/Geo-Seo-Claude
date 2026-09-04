import test from "node:test";
import assert from "node:assert/strict";
import { readBrowserStorage, writeBrowserStorage, removeBrowserStorage } from "./browser-storage.ts";

test("storage helpers work without a browser", () => {
  assert.equal(readBrowserStorage("pendingAuditUrl"), null);
  assert.equal(writeBrowserStorage("pendingAuditUrl", "https://example.com"), false);
  assert.doesNotThrow(() => removeBrowserStorage("pendingAuditUrl"));
});

test("blocked storage cannot interrupt navigation after a successful audit", () => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    get localStorage() { throw new Error("Storage blocked"); },
  }});
  try {
    assert.equal(readBrowserStorage("pendingAuditUrl"), null);
    assert.equal(writeBrowserStorage("activation", "true"), false);
    assert.doesNotThrow(() => removeBrowserStorage("pendingAuditUrl"));
  } finally { Reflect.deleteProperty(globalThis, "window"); }
});

test("saved audit intent persists until explicitly cleared", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } }});
  try {
    assert.equal(writeBrowserStorage("pendingAuditUrl", "https://example.com/"), true);
    assert.equal(readBrowserStorage("pendingAuditUrl"), "https://example.com/");
    removeBrowserStorage("pendingAuditUrl");
    assert.equal(readBrowserStorage("pendingAuditUrl"), null);
  } finally { Reflect.deleteProperty(globalThis, "window"); }
});
