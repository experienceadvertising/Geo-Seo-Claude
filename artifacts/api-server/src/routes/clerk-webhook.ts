import { Router, type Request, type Response } from "express";
import { Webhook } from "svix";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { EmailService } from "../lib/emailService";
import { logger } from "../lib/logger";

const router = Router();

// NOTE: This route must be registered with express.raw() in app.ts,
// BEFORE express.json() — just like the Stripe webhook.
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn("CLERK_WEBHOOK_SECRET not configured — Clerk webhook skipped");
    res.status(200).json({ received: true });
    return;
  }

  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: "Missing svix headers" });
    return;
  }

  let event: any;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(req.body as Buffer, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err: any) {
    logger.error({ err: err?.message }, "Clerk webhook signature verification failed");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  const { type, data } = event as { type: string; data: any };
  logger.info({ type }, "Clerk webhook received");

  if (type === "user.created") {
    const userId: string = data.id;
    const emailObj = (data.email_addresses ?? []).find(
      (e: any) => e.id === data.primary_email_address_id
    );
    const email: string | null = emailObj?.email_address ?? null;
    const firstName: string = data.first_name ?? "";

    // Upsert user into DB so welcome series can track state
    if (email) {
      await db
        .insert(usersTable)
        .values({ id: userId, email })
        .onConflictDoUpdate({ target: usersTable.id, set: { email } })
        .catch((e) => logger.error({ err: e.message }, "Failed to upsert user from Clerk webhook"));

      // Send welcome email immediately
      const ok = await EmailService.sendWelcome(email, firstName);
      if (ok) {
        await db
          .update(usersTable)
          .set({ welcomeEmailSentAt: new Date() })
          .where(eq(usersTable.id, userId))
          .catch((e) => logger.error({ err: e.message }, "Failed to record welcome email"));
      }
    }
  }

  res.status(200).json({ received: true });
});

export default router;
