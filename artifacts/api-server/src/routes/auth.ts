import { Router } from "express";
import type { Request } from "express";
import { randomBytes, randomUUID, createHash } from "crypto";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, and, or, isNull } from "drizzle-orm";
import { EmailService } from "../lib/emailService";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { TRIAL_LENGTH_DAYS } from "../lib/planUtils";
import {
  loginRateLimiter,
  registerRateLimiter,
  passwordEmailRateLimiter,
  unsubscribeRateLimiter,
} from "../middlewares/rateLimiters";

const router = Router();
const SALT_ROUNDS = 12;
const PRODUCTION_HOST = "aeoimprovement.com";

// Pre-computed bcrypt hash of a random throwaway string. Used to make /login
// timing equivalent for "user exists" vs "user does not exist" responses.
const DUMMY_HASH = bcrypt.hashSync("__dummy_password_for_timing__", SALT_ROUNDS);

function token() {
  return randomBytes(32).toString("hex");
}

// Email-verification and password-reset tokens are one-time secrets that only
// ever travel in an email link — they are never re-read from the DB to build
// a URL. We therefore store only their SHA-256 hash: a DB/backup/log leak then
// yields hashes, not working tokens. The raw token from the link is hashed and
// matched at lookup time. (The unsubscribe token is intentionally NOT hashed —
// it is re-read from the DB to construct unsubscribe links in every email.)
function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Build the set of hostnames we are willing to embed in outbound emails.
 * Anything not in this set is treated as a phishing attempt (since the auth
 * routes are unauthenticated, an attacker could otherwise spoof Origin /
 * Referer to make us mail a victim a malicious verify / reset link).
 */
function buildAllowedHosts(): Set<string> {
  const hosts = new Set<string>([PRODUCTION_HOST, `www.${PRODUCTION_HOST}`]);

  // Explicit override (preferred in production).
  if (process.env.FRONTEND_URL) {
    try { hosts.add(new URL(process.env.FRONTEND_URL).host); } catch { /* ignore */ }
  }

  // Replit-injected domains for the dev preview / deployment.
  const csv = (s: string | undefined) =>
    (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  for (const d of csv(process.env.REPLIT_DOMAINS)) hosts.add(d);
  if (process.env.REPLIT_DEV_DOMAIN) hosts.add(process.env.REPLIT_DEV_DOMAIN);

  return hosts;
}
const ALLOWED_HOSTS = buildAllowedHosts();
const PRODUCTION_BASE_URL = `https://${PRODUCTION_HOST}`;

/**
 * Resolve the public base URL for the user-facing app from the request.
 * Returns a URL on a known-trusted host so attackers can't trick us into
 * emailing users a phishing link by spoofing Origin / Referer headers.
 *
 * This also ensures users who sign up via the dev preview receive a
 * verification link that returns to the same dev preview, instead of a
 * production URL whose database does not contain their token.
 */
function baseUrlFromReq(req: Request): string {
  // Explicit env override always wins (single source of truth in prod).
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, "");

  const candidates: string[] = [];

  const origin = req.get("origin");
  if (origin) candidates.push(origin);

  const referer = req.get("referer");
  if (referer) {
    try {
      const u = new URL(referer);
      candidates.push(`${u.protocol}//${u.host}`);
    } catch { /* ignore */ }
  }

  const xfProto = (req.get("x-forwarded-proto") || req.protocol || "https")
    .split(",")[0].trim();
  const xfHost = (req.get("x-forwarded-host") || req.get("host") || "")
    .split(",")[0].trim();
  if (xfHost) candidates.push(`${xfProto}://${xfHost}`);

  for (const raw of candidates) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "https:" && u.protocol !== "http:") continue;
      if (ALLOWED_HOSTS.has(u.host)) return `${u.protocol}//${u.host}`;
    } catch { /* skip malformed */ }
  }

  // No trusted candidate — fall back to production. Worst case: a dev
  // signup gets a production link (the original bug), but we never send
  // an attacker-controlled phishing URL.
  return PRODUCTION_BASE_URL;
}

// ── Register ──────────────────────────────────────────────────────────────────
router.post("/auth/register", registerRateLimiter, async (req, res): Promise<void> => {
  const { email, password, firstName, referralCode: refCode } = req.body as {
    email?: string;
    password?: string;
    firstName?: string;
    referralCode?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Invalid email address." });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (existing) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const verToken = token();
  const verExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
  const userId = randomUUID();
  const unsubToken = token();
  const myReferralCode = randomBytes(4).toString("hex").toUpperCase();

  const cleanRef = refCode?.trim().toUpperCase() || null;
  let referredBy: string | null = null;
  if (cleanRef) {
    const [referrer] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.referralCode, cleanRef));
    if (referrer) referredBy = cleanRef;
  }

  await db.insert(usersTable).values({
    id: userId,
    email: normalizedEmail,
    firstName: firstName?.trim() || null,
    passwordHash,
    emailVerified: false,
    verificationToken: hashToken(verToken),
    verificationExpires: verExpires,
    plan: "free",
    // Free all-access first month: full feature entitlements until this
    // date (see planUtils.getPlanInfo). Stored explicitly so support can
    // extend an individual user's trial by bumping the column.
    trialEndsAt: new Date(Date.now() + TRIAL_LENGTH_DAYS * 24 * 60 * 60 * 1000),
    unsubscribeToken: unsubToken,
    referralCode: myReferralCode,
    referredBy,
  });

  const baseUrl = baseUrlFromReq(req);
  const verifyUrl = `${baseUrl}/verify-email?token=${verToken}`;
  await EmailService.sendVerificationEmail(normalizedEmail, firstName?.trim() || "", verifyUrl);

  // The "Welcome" introduction email is deferred until the user has actually
  // verified their email address. Sending it pre-verification trains people
  // to ignore our mail and risks reputation damage on Postmark.

  // Operational notification to ADMIN_EMAILS — fire-and-forget so a Postmark
  // hiccup never breaks a signup. Logged on failure inside the service.
  EmailService.sendAdminNotification(`[Signup] ${normalizedEmail}`, [
    `New user registered`,
    ``,
    `Email: ${normalizedEmail}`,
    `Name: ${firstName?.trim() || "(not provided)"}`,
    `User ID: ${userId}`,
    `Time: ${new Date().toISOString()}`,
    `Origin: ${baseUrl}`,
  ]).catch((err) => logger.warn({ err }, "Admin signup notification failed"));

  logger.info({ userId, email: normalizedEmail, baseUrl }, "User registered");
  res.status(201).json({
    message: "Account created! Check your email for a verification link.",
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/auth/login", loginRateLimiter, async (req, res): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  // Always run a bcrypt comparison to keep timing constant whether the
  // account exists or not. This prevents email-enumeration timing attacks.
  const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
  const valid = await bcrypt.compare(password, hashToCompare);

  if (!user || !user.passwordHash || !valid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  if (!user.emailVerified) {
    res.status(403).json({
      error: "Please verify your email before signing in. Check your inbox for the verification link.",
      code: "email_not_verified",
    });
    return;
  }

  req.session.regenerate((err) => {
    if (err) {
      logger.error({ err }, "Session regenerate error");
      res.status(500).json({ error: "Login failed. Please try again." });
      return;
    }
    req.session.userId = user.id;
    req.session.email = normalizedEmail;
    req.session.save((saveErr) => {
      if (saveErr) {
        logger.error({ saveErr }, "Session save error");
        res.status(500).json({ error: "Login failed. Please try again." });
        return;
      }
      logger.info({ userId: user.id }, "User logged in");
      res.json({
        userId: user.id,
        email: normalizedEmail,
        firstName: user.firstName,
        plan: user.plan,
        emailVerified: user.emailVerified,
      });
    });
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) logger.error({ err }, "Session destroy error");
    res.clearCookie("aeo.sid");
    res.json({ ok: true });
  });
});

// ── Verify Email ──────────────────────────────────────────────────────────────
router.get("/auth/verify-email", async (req, res): Promise<void> => {
  const { token: verToken } = req.query as { token?: string };
  if (!verToken) {
    res.status(400).json({ error: "Missing token.", code: "missing_token" });
    return;
  }

  // Match the hashed token; also accept a legacy plaintext match so links
  // already sent before tokens were hashed at rest keep working.
  const [user] = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.verificationToken, hashToken(verToken)), eq(usersTable.verificationToken, verToken)));

  if (!user) {
    res.status(400).json({
      error: "This verification link is invalid. It may have already been used — try signing in.",
      code: "invalid_token",
    });
    return;
  }

  if (user.verificationExpires && user.verificationExpires < new Date()) {
    res.status(400).json({
      error: "This verification link has expired. Request a new one below.",
      code: "expired_token",
    });
    return;
  }

  await db
    .update(usersTable)
    .set({ emailVerified: true, verificationToken: null, verificationExpires: null })
    .where(eq(usersTable.id, user.id));

  // Now that the user has confirmed their email, kick off the welcome series.
  // We do this here (rather than at registration) so we never email people
  // who never validated their address.
  //
  // Use an atomic "claim" update — UPDATE … WHERE welcome_email_sent_at IS
  // NULL — so two concurrent verify clicks can't both send the welcome
  // email. Only the request whose UPDATE actually changed a row sends.
  if (!user.welcomeEmailSentAt) {
    const claim = await db
      .update(usersTable)
      .set({ welcomeEmailSentAt: new Date() })
      .where(and(eq(usersTable.id, user.id), isNull(usersTable.welcomeEmailSentAt)))
      .returning({ id: usersTable.id });

    if (claim.length === 1) {
      const firstName = user.firstName || user.email?.split("@")[0] || "";
      const unsubUrl = user.unsubscribeToken
        ? `${baseUrlFromReq(req)}/api/auth/unsubscribe?token=${user.unsubscribeToken}`
        : undefined;
      EmailService.sendWelcome(user.email!, firstName, unsubUrl)
        .then((ok) => {
          if (!ok) {
            // Roll the claim back so a future click can retry.
            return db
              .update(usersTable)
              .set({ welcomeEmailSentAt: null })
              .where(eq(usersTable.id, user.id));
          }
        })
        .catch((err) => {
          logger.error({ err, userId: user.id }, "Welcome email failed");
          db.update(usersTable)
            .set({ welcomeEmailSentAt: null })
            .where(eq(usersTable.id, user.id))
            .catch(() => { /* best-effort rollback */ });
        });
    }
  }

  logger.info({ userId: user.id }, "Email verified");
  res.json({ ok: true, message: "Email verified! You can now sign in." });
});

// ── Resend Verification ───────────────────────────────────────────────────────
router.post("/auth/resend-verification", passwordEmailRateLimiter, async (req, res): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: "Email required." });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (!user || user.emailVerified) {
    // Don't reveal whether email exists
    res.json({ message: "If that email is registered and unverified, a new link has been sent." });
    return;
  }

  const verToken = token();
  const verExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db
    .update(usersTable)
    .set({ verificationToken: hashToken(verToken), verificationExpires: verExpires })
    .where(eq(usersTable.id, user.id));

  const baseUrl = baseUrlFromReq(req);
  const verifyUrl = `${baseUrl}/verify-email?token=${verToken}`;
  await EmailService.sendVerificationEmail(normalizedEmail, user.firstName || "", verifyUrl);

  res.json({ message: "If that email is registered and unverified, a new link has been sent." });
});

// ── Forgot Password ───────────────────────────────────────────────────────────
router.post("/auth/forgot-password", passwordEmailRateLimiter, async (req, res): Promise<void> => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: "Email required." });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail));

  if (user) {
    const resetTok = token();
    const resetExp = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await db
      .update(usersTable)
      .set({ resetToken: hashToken(resetTok), resetExpires: resetExp })
      .where(eq(usersTable.id, user.id));

    const baseUrl = baseUrlFromReq(req);
    const resetUrl = `${baseUrl}/reset-password?token=${resetTok}`;
    await EmailService.sendPasswordReset(normalizedEmail, user.firstName || "", resetUrl);
  }

  // Always return the same message to prevent email enumeration
  res.json({ message: "If that email is registered, a password reset link has been sent." });
});

// ── Reset Password ────────────────────────────────────────────────────────────
router.post("/auth/reset-password", passwordEmailRateLimiter, async (req, res): Promise<void> => {
  const { token: resetTok, password } = req.body as { token?: string; password?: string };

  if (!resetTok || !password) {
    res.status(400).json({ error: "Token and new password are required." });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  // Match the hashed token; also accept a legacy plaintext match so reset
  // links already in flight before tokens were hashed at rest keep working.
  const [user] = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.resetToken, hashToken(resetTok)), eq(usersTable.resetToken, resetTok)));

  if (!user) {
    res.status(400).json({ error: "Invalid or expired reset link." });
    return;
  }

  if (user.resetExpires && user.resetExpires < new Date()) {
    res.status(400).json({ error: "Reset link has expired. Please request a new one." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await db
    .update(usersTable)
    .set({ passwordHash, resetToken: null, resetExpires: null, emailVerified: true })
    .where(eq(usersTable.id, user.id));

  // Reset == password change. Notify so the account owner sees an alert if
  // someone else successfully reset their password (e.g., compromised inbox).
  if (user.email) {
    EmailService.sendPasswordChanged(user.email, user.firstName || "").catch((err) =>
      logger.error({ err, userId: user.id }, "Password-changed email failed (post-reset)"),
    );
  }

  // If the user reset their password before ever verifying their email
  // (clicking the reset link verifies them), they never received the welcome
  // series. Kick it off now using the same atomic-claim pattern as
  // /verify-email so concurrent resets can't double-send.
  if (!user.welcomeEmailSentAt && user.email) {
    const claim = await db
      .update(usersTable)
      .set({ welcomeEmailSentAt: new Date() })
      .where(and(eq(usersTable.id, user.id), isNull(usersTable.welcomeEmailSentAt)))
      .returning({ id: usersTable.id });

    if (claim.length === 1) {
      const firstName = user.firstName || user.email.split("@")[0] || "";
      const unsubUrl = user.unsubscribeToken
        ? `${baseUrlFromReq(req)}/api/auth/unsubscribe?token=${user.unsubscribeToken}`
        : undefined;
      EmailService.sendWelcome(user.email, firstName, unsubUrl)
        .then((ok) => {
          if (!ok) {
            return db
              .update(usersTable)
              .set({ welcomeEmailSentAt: null })
              .where(eq(usersTable.id, user.id));
          }
        })
        .catch((err) => {
          logger.error({ err, userId: user.id }, "Welcome email failed (post-reset)");
          db.update(usersTable)
            .set({ welcomeEmailSentAt: null })
            .where(eq(usersTable.id, user.id))
            .catch(() => { /* best-effort rollback */ });
        });
    }
  }

  logger.info({ userId: user.id }, "Password reset");
  res.json({ ok: true, message: "Password updated successfully. You can now sign in." });
});

// ── Change Password (logged-in users) ─────────────────────────────────────────
router.post("/auth/change-password", requireAuth, async (req, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password are required." });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!));

  if (!user || !user.passwordHash) {
    res.status(404).json({ error: "Account not found." });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Current password is incorrect." });
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db
    .update(usersTable)
    .set({ passwordHash })
    .where(eq(usersTable.id, user.id));

  // Send a security-notification email so the user knows their password was
  // changed. Fire-and-forget — we don't want a Postmark hiccup to block the
  // password change response.
  if (user.email) {
    EmailService.sendPasswordChanged(user.email, user.firstName || "").catch((err) =>
      logger.error({ err, userId: user.id }, "Password-changed email failed"),
    );
  }

  logger.info({ userId: user.id }, "Password changed");
  res.json({ ok: true, message: "Password updated." });
});

// ── Unsubscribe ───────────────────────────────────────────────────────────────
// Token-based, no auth required. The same URL is used in:
//   1. The footer "Unsubscribe" link in every marketing/digest email
//   2. The RFC 8058 List-Unsubscribe-Post header (Gmail / Apple Mail
//      one-click unsubscribe button)
//
// GET → redirect to friendly frontend confirmation page.
// POST → flip email_opt_out=true atomically. Idempotent.
router.get("/auth/unsubscribe", unsubscribeRateLimiter, (req, res): void => {
  const tok = (req.query.token as string | undefined) ?? "";
  if (!tok) {
    res.status(400).send("Missing token.");
    return;
  }
  const baseUrl = baseUrlFromReq(req);
  res.redirect(`${baseUrl}/unsubscribe?token=${encodeURIComponent(tok)}`);
});

router.post("/auth/unsubscribe", unsubscribeRateLimiter, async (req, res): Promise<void> => {
  // Token may arrive in body (frontend POST) or query (Gmail one-click POST).
  const tok =
    (req.body && typeof req.body === "object" && (req.body as any).token) ||
    (req.query.token as string | undefined) ||
    "";
  if (!tok || typeof tok !== "string") {
    res.status(400).json({ error: "Missing token." });
    return;
  }

  const result = await db
    .update(usersTable)
    .set({ emailOptOut: true })
    .where(eq(usersTable.unsubscribeToken, tok))
    .returning({ id: usersTable.id, email: usersTable.email });

  if (result.length === 0) {
    // Don't reveal whether the token existed — return 200 either way so a
    // bot scraping random tokens learns nothing.
    res.json({ ok: true });
    return;
  }

  logger.info({ userId: result[0].id }, "User unsubscribed via token");
  res.json({ ok: true });
});

// Look up subscription state for the frontend confirmation page so it can
// render either "You're subscribed → unsubscribe" or "You're already
// unsubscribed → resubscribe" without revealing the user's full email.
//
// Rate-limited so the 256-bit token space can't be probed.
router.get("/auth/unsubscribe-info", unsubscribeRateLimiter, async (req, res): Promise<void> => {
  const tok = (req.query.token as string | undefined) ?? "";
  if (!tok) {
    res.status(400).json({ error: "Missing token." });
    return;
  }
  const [user] = await db
    .select({ email: usersTable.email, emailOptOut: usersTable.emailOptOut })
    .from(usersTable)
    .where(eq(usersTable.unsubscribeToken, tok));

  if (!user || !user.email) {
    // Use 200 + null so a scraper can't tell valid tokens from invalid via
    // status code or response shape. Frontend renders "invalid link" copy
    // when email is null.
    res.json({ email: null, optedOut: null });
    return;
  }

  // Mask the email for display: a***@example.com
  const [local, domain] = user.email.split("@");
  const masked = local.length <= 1
    ? `*@${domain}`
    : `${local[0]}${"*".repeat(Math.min(local.length - 1, 6))}@${domain}`;

  res.json({ email: masked, optedOut: user.emailOptOut });
});

router.post("/auth/resubscribe", unsubscribeRateLimiter, async (req, res): Promise<void> => {
  const tok =
    (req.body && typeof req.body === "object" && (req.body as any).token) ||
    (req.query.token as string | undefined) ||
    "";
  if (!tok || typeof tok !== "string") {
    res.status(400).json({ error: "Missing token." });
    return;
  }

  const result = await db
    .update(usersTable)
    .set({ emailOptOut: false })
    .where(eq(usersTable.unsubscribeToken, tok))
    .returning({ id: usersTable.id });

  if (result.length === 0) {
    res.json({ ok: true });
    return;
  }
  logger.info({ userId: result[0].id }, "User resubscribed via token");
  res.json({ ok: true });
});

// ── Get Current Session ───────────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      firstName: usersTable.firstName,
      plan: usersTable.plan,
      emailVerified: usersTable.emailVerified,
    })
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

export default router;
