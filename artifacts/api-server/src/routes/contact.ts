import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { EmailService } from "../lib/emailService";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Contact form is unauthenticated by design (so prospects can reach us
// without signing up). IP-based limit keeps spammers / bots from flooding
// the admin inbox.
const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip || "anon") || "anon",
  message: { error: "Too many messages from this address. Please try again in an hour." },
});

router.post("/contact", contactRateLimiter, async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const asStr = (v: unknown) => (typeof v === "string" ? v : "");
  const name = asStr(body.name);
  const email = asStr(body.email);
  const message = asStr(body.message);
  const website = asStr(body.website);

  // Honeypot — real users never fill the hidden `website` field. Bots scrape
  // and fill every input. Silently 200 so the bot doesn't retry.
  if (website && website.trim().length > 0) {
    res.status(200).json({ ok: true });
    return;
  }

  // Strip CR/LF from name + email before they end up in admin email subjects
  // / From-display headers. Postmark's API doesn't take raw header strings
  // (so injection isn't possible at the protocol level), but defence in depth
  // is cheap and keeps the admin UI clean if someone pastes multi-line input.
  const cleanEmail = (email || "").trim().toLowerCase().replace(/[\r\n]/g, "");
  const cleanMessage = (message || "").trim();
  const cleanName = (name || "").trim().replace(/[\r\n]/g, " ").slice(0, 120);

  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    res.status(400).json({ error: "A valid email address is required." });
    return;
  }
  if (cleanMessage.length < 5) {
    res.status(400).json({ error: "Please include a message." });
    return;
  }
  if (cleanMessage.length > 5000) {
    res.status(400).json({ error: "Message is too long (5000 characters max)." });
    return;
  }

  // If the sender is signed in, attach their user id + plan so the admin
  // sees who's writing in. Failure here is non-fatal.
  // This route is unauthenticated (no requireAuth), so req.userId is never
  // set — read the session directly.
  let userId: string | null = req.session?.userId ?? null;
  let userPlan: string | null = null;
  if (userId) {
    try {
      const [u] = await db
        .select({ plan: usersTable.plan })
        .from(usersTable)
        .where(eq(usersTable.id, userId));
      userPlan = u?.plan ?? null;
    } catch { /* ignore */ }
  }

  try {
    await EmailService.sendContactForm(cleanEmail, cleanName, cleanMessage, {
      userId,
      userPlan,
      userAgent: (req.headers["user-agent"] as string) || null,
    });
    logger.info({ email: cleanEmail, userId }, "Contact form submitted");
    res.json({ ok: true });
  } catch (err: any) {
    logger.error({ err: err?.message }, "Contact form forward failed");
    res.status(500).json({ error: "Could not send your message. Please email info@aeoimprovement.com directly." });
  }
});

export default router;
