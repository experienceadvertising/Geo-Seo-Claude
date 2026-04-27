import { Router } from "express";
import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { EmailService } from "../lib/emailService";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();
const SALT_ROUNDS = 12;
const BASE_URL = process.env.FRONTEND_URL || "https://aeoimprovement.com";

function token() {
  return randomBytes(32).toString("hex");
}

// ── Register ──────────────────────────────────────────────────────────────────
router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, firstName } = req.body as {
    email?: string;
    password?: string;
    firstName?: string;
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

  await db.insert(usersTable).values({
    id: userId,
    email: normalizedEmail,
    firstName: firstName?.trim() || null,
    passwordHash,
    emailVerified: false,
    verificationToken: verToken,
    verificationExpires: verExpires,
    plan: "free",
  });

  const verifyUrl = `${BASE_URL}/verify-email?token=${verToken}`;
  await EmailService.sendVerificationEmail(normalizedEmail, firstName?.trim() || "", verifyUrl);

  // Send welcome email
  await EmailService.sendWelcome(normalizedEmail, firstName?.trim() || "");
  await db
    .update(usersTable)
    .set({ welcomeEmailSentAt: new Date() })
    .where(eq(usersTable.id, userId));

  logger.info({ userId, email: normalizedEmail }, "User registered");
  res.status(201).json({
    message: "Account created! Check your email for a verification link.",
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res): Promise<void> => {
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

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
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
    res.status(400).json({ error: "Missing token." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.verificationToken, verToken));

  if (!user) {
    res.status(400).json({ error: "Invalid or expired verification link." });
    return;
  }

  if (user.verificationExpires && user.verificationExpires < new Date()) {
    res.status(400).json({ error: "Verification link has expired. Please request a new one." });
    return;
  }

  await db
    .update(usersTable)
    .set({ emailVerified: true, verificationToken: null, verificationExpires: null })
    .where(eq(usersTable.id, user.id));

  logger.info({ userId: user.id }, "Email verified");
  res.json({ ok: true, message: "Email verified! You can now sign in." });
});

// ── Resend Verification ───────────────────────────────────────────────────────
router.post("/auth/resend-verification", async (req, res): Promise<void> => {
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
    .set({ verificationToken: verToken, verificationExpires: verExpires })
    .where(eq(usersTable.id, user.id));

  const verifyUrl = `${BASE_URL}/verify-email?token=${verToken}`;
  await EmailService.sendVerificationEmail(normalizedEmail, user.firstName || "", verifyUrl);

  res.json({ message: "If that email is registered and unverified, a new link has been sent." });
});

// ── Forgot Password ───────────────────────────────────────────────────────────
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
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
      .set({ resetToken: resetTok, resetExpires: resetExp })
      .where(eq(usersTable.id, user.id));

    const resetUrl = `${BASE_URL}/reset-password?token=${resetTok}`;
    await EmailService.sendPasswordReset(normalizedEmail, user.firstName || "", resetUrl);
  }

  // Always return the same message to prevent email enumeration
  res.json({ message: "If that email is registered, a password reset link has been sent." });
});

// ── Reset Password ────────────────────────────────────────────────────────────
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token: resetTok, password } = req.body as { token?: string; password?: string };

  if (!resetTok || !password) {
    res.status(400).json({ error: "Token and new password are required." });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.resetToken, resetTok));

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

  logger.info({ userId: user.id }, "Password reset");
  res.json({ ok: true, message: "Password updated successfully. You can now sign in." });
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
