import { Router, type IRouter } from "express";
import { randomBytes, randomUUID } from "crypto";
import { db, usersTable, referralRewardsTable } from "@workspace/db";
import { eq, and, count, sum } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { readRateLimiter } from "../middlewares/rateLimiters";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

function getReferralLink(code: string, req: any): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  const base = domain ? `https://${domain}` : `${req.protocol}://${req.get("host")}`;
  return `${base}/sign-up?ref=${code}`;
}

router.get("/referral", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  try {
    const userId = req.userId!;

    let [user] = await db
      .select({ referralCode: usersTable.referralCode })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!user.referralCode) {
      const code = generateReferralCode();
      await db
        .update(usersTable)
        .set({ referralCode: code })
        .where(eq(usersTable.id, userId));
      user = { referralCode: code };
    }

    const code = user.referralCode!;

    const [pendingResult, paidResult] = await Promise.all([
      db
        .select({ count: count() })
        .from(referralRewardsTable)
        .where(and(eq(referralRewardsTable.referrerId, userId), eq(referralRewardsTable.status, "pending"))),
      db
        .select({ count: count(), total: sum(referralRewardsTable.amountCents) })
        .from(referralRewardsTable)
        .where(and(eq(referralRewardsTable.referrerId, userId), eq(referralRewardsTable.status, "paid"))),
    ]);

    const pendingCount = pendingResult[0]?.count ?? 0;
    const paidCount = paidResult[0]?.count ?? 0;
    const totalEarnedCents = Number(paidResult[0]?.total ?? 0);

    res.json({
      referralCode: code,
      referralLink: getReferralLink(code, req),
      stats: {
        pendingRewards: pendingCount,
        paidRewards: paidCount,
        totalEarnedDollars: totalEarnedCents / 100,
      },
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to get referral info");
    res.status(500).json({ error: "Failed to load referral info" });
  }
});

router.post("/referral/apply", requireAuth, async (req, res): Promise<void> => {
  try {
    const userId = req.userId!;
    const { code } = req.body as { code?: string };

    if (!code) {
      res.status(400).json({ error: "Referral code required" });
      return;
    }

    const [user] = await db
      .select({ referredBy: usersTable.referredBy })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (user?.referredBy) {
      res.json({ ok: true, message: "Referral already applied" });
      return;
    }

    const [referrer] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.referralCode, code.toUpperCase()));

    if (!referrer) {
      res.status(404).json({ error: "Invalid referral code" });
      return;
    }

    if (referrer.id === userId) {
      res.status(400).json({ error: "You cannot refer yourself" });
      return;
    }

    await db
      .update(usersTable)
      .set({ referredBy: code.toUpperCase() })
      .where(eq(usersTable.id, userId));

    logger.info({ userId, referralCode: code }, "Referral applied");
    res.json({ ok: true });
  } catch (err: any) {
    logger.error({ err }, "Failed to apply referral code");
    res.status(500).json({ error: "Failed to apply referral code" });
  }
});

export async function creditReferralIfEligible(paidUserId: string): Promise<void> {
  try {
    const [user] = await db
      .select({ referredBy: usersTable.referredBy, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, paidUserId));

    if (!user?.referredBy) return;

    const [referrer] = await db
      .select({ id: usersTable.id, email: usersTable.email, firstName: usersTable.firstName, stripeCustomerId: usersTable.stripeCustomerId })
      .from(usersTable)
      .where(eq(usersTable.referralCode, user.referredBy));

    if (!referrer) return;

    const existing = await db
      .select({ id: referralRewardsTable.id })
      .from(referralRewardsTable)
      .where(eq(referralRewardsTable.referredUserId, paidUserId));

    if (existing.length > 0) return;

    const rewardId = randomUUID();
    await db.insert(referralRewardsTable).values({
      id: rewardId,
      referrerId: referrer.id,
      referredUserId: paidUserId,
      status: "pending",
      amountCents: 2500,
    });

    let creditApplied = false;

    if (referrer.stripeCustomerId) {
      try {
        const { getUncachableStripeClient } = await import("../lib/stripeClient");
        const stripe = await getUncachableStripeClient();
        const tx = await stripe.customers.createBalanceTransaction(
          referrer.stripeCustomerId,
          { amount: -2500, currency: "usd", description: "Referral reward — $25 credit" },
        );
        await db
          .update(referralRewardsTable)
          .set({ status: "paid", paidAt: new Date(), stripeBalanceTxId: tx.id })
          .where(eq(referralRewardsTable.id, rewardId));
        creditApplied = true;
        logger.info({ referrerId: referrer.id, paidUserId, txId: tx.id }, "Referral reward credited via Stripe balance");
      } catch (stripeErr: any) {
        logger.warn({ err: stripeErr?.message, referrerId: referrer.id }, "Stripe balance credit failed — reward stays pending");
      }
    }

    if (referrer.email) {
      const { EmailService } = await import("../lib/emailService");
      if (creditApplied) {
        EmailService.sendReferralReward(referrer.email, referrer.firstName || "", 25).catch(
          (err: any) => logger.error({ err }, "Referral reward email failed"),
        );
      } else {
        EmailService.sendReferralRewardPending(referrer.email, referrer.firstName || "", 25).catch(
          (err: any) => logger.error({ err }, "Referral reward pending email failed"),
        );
      }
    }
  } catch (err: any) {
    logger.error({ err }, "creditReferralIfEligible failed");
  }
}

export async function applyPendingReferralRewards(userId: string, stripeCustomerId: string): Promise<void> {
  try {
    const pendingRewards = await db
      .select()
      .from(referralRewardsTable)
      .where(and(eq(referralRewardsTable.referrerId, userId), eq(referralRewardsTable.status, "pending")));

    if (pendingRewards.length === 0) return;

    const { getUncachableStripeClient } = await import("../lib/stripeClient");
    const stripe = await getUncachableStripeClient();

    for (const reward of pendingRewards) {
      try {
        const tx = await stripe.customers.createBalanceTransaction(
          stripeCustomerId,
          { amount: -reward.amountCents, currency: "usd", description: "Referral reward — $25 credit" },
        );
        await db
          .update(referralRewardsTable)
          .set({ status: "paid", paidAt: new Date(), stripeBalanceTxId: tx.id })
          .where(eq(referralRewardsTable.id, reward.id));
        logger.info({ userId, rewardId: reward.id, txId: tx.id }, "Pending referral reward applied on upgrade");
      } catch (err: any) {
        logger.warn({ err: err?.message, rewardId: reward.id }, "Failed to apply pending referral reward");
      }
    }

    if (pendingRewards.length > 0) {
      const [referrer] = await db
        .select({ email: usersTable.email, firstName: usersTable.firstName })
        .from(usersTable)
        .where(eq(usersTable.id, userId));
      if (referrer?.email) {
        const totalDollars = pendingRewards.reduce((sum, r) => sum + r.amountCents, 0) / 100;
        const { EmailService } = await import("../lib/emailService");
        EmailService.sendReferralReward(referrer.email, referrer.firstName || "", totalDollars).catch(
          (err: any) => logger.error({ err }, "Referral reward applied-on-upgrade email failed"),
        );
      }
    }
  } catch (err: any) {
    logger.error({ err }, "applyPendingReferralRewards failed");
  }
}

export default router;
