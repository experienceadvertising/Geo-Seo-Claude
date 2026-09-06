import webpush from "web-push";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import { safePushMessage, validVapidConfiguration, type PushMessage } from "./pushPayload";

function config() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!validVapidConfiguration(publicKey, privateKey, subject)) return null;
  return { publicKey: publicKey!, privateKey: privateKey!, subject: subject! };
}

export const PushService = {
  configured: () => Boolean(config()),
  async sendToUser(userId: string, message: PushMessage): Promise<{ sent: number; failed: number }> {
    const vapid = config();
    if (!vapid) return { sent: 0, failed: 0 };
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);
    const subscriptions = await db.select().from(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.userId, userId));
    let sent = 0;
    let failed = 0;
    const payload = JSON.stringify(safePushMessage(message));
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload, { TTL: 86400, urgency: "normal", timeout: 10000 });
        sent++;
        if (subscription.lastError) await db.update(pushSubscriptionsTable).set({ lastError: null, updatedAt: new Date() }).where(eq(pushSubscriptionsTable.id, subscription.id));
      } catch (error) {
        failed++;
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
        if (statusCode === 404 || statusCode === 410) {
          await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, subscription.id));
        } else {
          await db.update(pushSubscriptionsTable).set({ lastError: statusCode ? `HTTP ${statusCode}` : "delivery_failed", updatedAt: new Date() }).where(eq(pushSubscriptionsTable.id, subscription.id));
        }
        logger.warn({ statusCode: statusCode || undefined }, "Browser push delivery failed");
      }
    }
    return { sent, failed };
  },
};
