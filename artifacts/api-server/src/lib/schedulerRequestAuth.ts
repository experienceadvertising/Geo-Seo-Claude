import { createHmac, timingSafeEqual } from "node:crypto";

/** Validate a scheduler signature. Job-slot claims still provide replay safety. */
export function verifySchedulerRequest(
  secret: string | undefined,
  timestamp: string | undefined,
  signature: string | undefined,
  rawBody: string,
  now = Date.now(),
): boolean {
  if (!/^[a-f0-9]{64}$/.test(secret || "") || !/^\d{13}$/.test(timestamp || "") || !/^[a-f0-9]{64}$/.test(signature || "")) return false;
  if (!Number.isFinite(now) || Math.abs(now - Number(timestamp)) > 5 * 60_000 || Buffer.byteLength(rawBody, "utf8") > 4096) return false;
  const expected = createHmac("sha256", secret!).update(`${timestamp}\nPOST\n/api/internal/scheduler\n${rawBody}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature!, "hex"));
}
