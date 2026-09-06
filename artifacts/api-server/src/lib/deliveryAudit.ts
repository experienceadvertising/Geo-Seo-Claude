import { AsyncLocalStorage } from "node:async_hooks";
export type DeliveryOutcome = { channel: "email" | "push"; outcome: "accepted" | "failed" | "uncertain" | "expired" };
type Outcome = DeliveryOutcome;
const scope = new AsyncLocalStorage<Outcome[]>();
export function recordDelivery(channel: Outcome["channel"], outcome: Outcome["outcome"]) { scope.getStore()?.push({ channel, outcome }); }
export async function withDeliveryAudit(work: () => Promise<void>, report: (outcomes: Outcome[]) => void | Promise<void> = () => {}) {
  const outcomes: Outcome[] = [];
  try { await scope.run(outcomes, work); }
  finally { await report(outcomes); }
  if (outcomes.some(item => item.outcome === "failed" || item.outcome === "uncertain")) {
    throw new Error("Notification delivery requires review; do not automatically resend");
  }
}
