import * as postmark from "postmark";
import { logger } from "./logger";
import {
  welcomeEmail,
  welcomeD3Email,
  welcomeD7Email,
  weeklyDigestEmail,
  monthlyReportEmail,
  verificationEmail,
  passwordResetEmail,
  passwordChangedEmail,
  paymentFailedEmail,
  subscriptionCanceledEmail,
  cardExpiringEmail,
  renewalReceiptEmail,
  limitReachedEmail,
  firstAuditEmail,
  auditCompleteEmail,
  simulationCompleteEmail,
  simulationReminderEmail,
  aeoInsightsEmail,
  scoreChangedEmail,
  approachingLimitEmail,
  whatYouMissedEmail,
  freeMonthPromoEmail,
  trialEndingSoonEmail,
  trialEndedEmail,
  referralRewardEmail,
  referralRewardPendingEmail,
  type WeeklyDigestData,
  type SimulationEmailContext,
  type MonthlyReportData,
} from "./emailTemplates";

const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "AEO Improvement <info@aeoimprovement.com>";

let cachedClient: postmark.ServerClient | null = null;
let cachedToken: string | undefined;
function getClient(): postmark.ServerClient | null {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    logger.warn("POSTMARK_API_TOKEN not set — email sending disabled");
    return null;
  }
  if (!cachedClient || cachedToken !== token) {
    cachedClient = new postmark.ServerClient(token);
    cachedToken = token;
  }
  return cachedClient;
}

async function send(
  to: string,
  subject: string,
  html: string,
  text: string,
  tag: string,
  unsubscribeUrl?: string,
): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  if (!to || !to.includes("@")) {
    logger.warn({ to, tag }, "Skipping email — invalid address");
    return false;
  }
  // Set RFC 2369 List-Unsubscribe header for marketing/digest mail. Modern
  // mail clients (Gmail, Apple Mail) surface this as a 1-click unsubscribe
  // button at the top of the email — better deliverability + CAN-SPAM /
  // RFC 8058 compliance.
  const headers = unsubscribeUrl
    ? [
        { Name: "List-Unsubscribe", Value: `<${unsubscribeUrl}>` },
        { Name: "List-Unsubscribe-Post", Value: "List-Unsubscribe=One-Click" },
      ]
    : undefined;
  try {
    await client.sendEmail({
      From: FROM_EMAIL,
      To: to,
      Subject: subject,
      HtmlBody: html,
      TextBody: text,
      MessageStream: "outbound",
      Tag: tag,
      Headers: headers,
    });
    logger.info({ to, tag }, "Email sent");
    return true;
  } catch (err: any) {
    logger.error({ err: err?.message, to, tag }, "Email send failed");
    return false;
  }
}

export const EmailService = {
  async sendWelcome(email: string, firstName: string, unsubscribeUrl?: string): Promise<boolean> {
    const { subject, html, text } = welcomeEmail(firstName, unsubscribeUrl);
    return send(email, subject, html, text, "welcome", unsubscribeUrl);
  },

  async sendWelcomeD3(email: string, firstName: string, hasAudit: boolean, unsubscribeUrl?: string): Promise<boolean> {
    const { subject, html, text } = welcomeD3Email(firstName, hasAudit, unsubscribeUrl);
    return send(email, subject, html, text, "welcome-d3", unsubscribeUrl);
  },

  async sendWelcomeD7(email: string, firstName: string, unsubscribeUrl?: string): Promise<boolean> {
    const { subject, html, text } = welcomeD7Email(firstName, unsubscribeUrl);
    return send(email, subject, html, text, "welcome-d7", unsubscribeUrl);
  },

  // Free-first-month lifecycle — sent by the daily trial job in emailScheduler.
  async sendFreeMonthPromo(email: string, firstName: string, endsAt: Date, unsubscribeUrl?: string): Promise<boolean> {
    const { subject, html, text } = freeMonthPromoEmail(firstName, endsAt, unsubscribeUrl);
    return send(email, subject, html, text, "free-month-promo", unsubscribeUrl);
  },

  async sendTrialEndingSoon(email: string, firstName: string, endsAt: Date, unsubscribeUrl?: string): Promise<boolean> {
    const { subject, html, text } = trialEndingSoonEmail(firstName, endsAt, unsubscribeUrl);
    return send(email, subject, html, text, "trial-ending-soon", unsubscribeUrl);
  },

  async sendTrialEnded(email: string, firstName: string, unsubscribeUrl?: string): Promise<boolean> {
    const { subject, html, text } = trialEndedEmail(firstName, unsubscribeUrl);
    return send(email, subject, html, text, "trial-ended", unsubscribeUrl);
  },

  async sendWeeklyDigest(email: string, data: WeeklyDigestData, unsubscribeUrl?: string): Promise<boolean> {
    const { subject, html, text } = weeklyDigestEmail(data, unsubscribeUrl);
    return send(email, subject, html, text, "weekly-digest", unsubscribeUrl);
  },

  async sendMonthlyReport(email: string, data: MonthlyReportData, unsubscribeUrl?: string): Promise<boolean> {
    const { subject, html, text } = monthlyReportEmail(data, unsubscribeUrl);
    return send(email, subject, html, text, "monthly-report", unsubscribeUrl);
  },

  // Transactional emails (no unsubscribe — legally exempt under CAN-SPAM).
  async sendVerificationEmail(email: string, firstName: string, verifyUrl: string): Promise<boolean> {
    const { subject, html, text } = verificationEmail(firstName, verifyUrl);
    return send(email, subject, html, text, "verify-email");
  },

  async sendPasswordReset(email: string, firstName: string, resetUrl: string): Promise<boolean> {
    const { subject, html, text } = passwordResetEmail(firstName, resetUrl);
    return send(email, subject, html, text, "password-reset");
  },

  async sendPasswordChanged(email: string, firstName: string): Promise<boolean> {
    const { subject, html, text } = passwordChangedEmail(firstName, "");
    return send(email, subject, html, text, "password-changed");
  },

  async sendPaymentFailed(email: string, firstName: string, attemptCount: number, nextRetryAt?: Date | null): Promise<boolean> {
    const { subject, html, text } = paymentFailedEmail(firstName, attemptCount, nextRetryAt);
    return send(email, subject, html, text, "payment-failed");
  },

  async sendSubscriptionCanceled(email: string, firstName: string, planName: string): Promise<boolean> {
    const { subject, html, text } = subscriptionCanceledEmail(firstName, planName);
    return send(email, subject, html, text, "subscription-canceled");
  },

  async sendCardExpiring(email: string, firstName: string, last4: string, expMonth: number, expYear: number): Promise<boolean> {
    const { subject, html, text } = cardExpiringEmail(firstName, last4, expMonth, expYear);
    return send(email, subject, html, text, "card-expiring");
  },

  async sendRenewalReceipt(email: string, firstName: string, planName: string, amount: string, periodEnd?: Date | null, invoiceUrl?: string | null): Promise<boolean> {
    const { subject, html, text } = renewalReceiptEmail(firstName, planName, amount, periodEnd, invoiceUrl);
    return send(email, subject, html, text, "renewal-receipt");
  },

  // Conversion-stage emails — these have an unsubscribe link because they
  // are marketing/upsell, not transactional under CAN-SPAM.
  async sendLimitReached(
    email: string,
    firstName: string,
    kind: "audits" | "simulations",
    cap: number,
    unsubscribeUrl?: string,
  ): Promise<boolean> {
    const { subject, html, text } = limitReachedEmail(firstName, kind, cap, unsubscribeUrl);
    return send(email, subject, html, text, `limit-reached-${kind}`, unsubscribeUrl);
  },

  async sendFirstAudit(
    email: string,
    firstName: string,
    url: string,
    geoScore: number,
    auditId: string | null | undefined,
    topRecommendation: string | null,
    unsubscribeUrl?: string,
  ): Promise<boolean> {
    const { subject, html, text } = firstAuditEmail(firstName, url, geoScore, auditId, topRecommendation, unsubscribeUrl);
    return send(email, subject, html, text, "first-audit", unsubscribeUrl);
  },

  // Transactional: fires on every completed audit except the first (that gets
  // the richer firstAudit email). Lets users close the tab and get back to
  // their results via a direct link.
  async sendAuditComplete(
    email: string,
    firstName: string,
    url: string,
    geoScore: number,
    auditId: string | null | undefined,
    unsubscribeUrl?: string,
  ): Promise<boolean> {
    const { subject, html, text } = auditCompleteEmail(firstName, url, geoScore, auditId, unsubscribeUrl);
    return send(email, subject, html, text, "audit-complete", unsubscribeUrl);
  },

  // Lifecycle reminder: sent only when a completed audit has no completed
  // simulation after a day. The scheduler filters by audit, not merely user.
  async sendSimulationReminder(
    email: string,
    firstName: string,
    url: string,
    auditId: number,
    unsubscribeUrl?: string,
  ): Promise<boolean> {
    const { subject, html, text } = simulationReminderEmail(firstName, url, auditId, unsubscribeUrl);
    return send(email, subject, html, text, "simulation-reminder", unsubscribeUrl);
  },

  // Transactional: fires after every completed prompt simulation so users who
  // closed the tab during a long run can come back and view their results.
  async sendSimulationComplete(
    email: string,
    firstName: string,
    domain: string,
    visibilityScore: number,
    auditId: number | null | undefined,
    unsubscribeUrl?: string,
    context?: SimulationEmailContext,
  ): Promise<boolean> {
    const { subject, html, text } = simulationCompleteEmail(firstName, domain, visibilityScore, auditId, unsubscribeUrl, context);
    return send(email, subject, html, text, "simulation-complete", unsubscribeUrl);
  },

  // Weekly AEO Insights — value-delivery email shipped to every active user
  // (free + paid) on Thursdays. Different content from the Pro weekly digest:
  // the digest summarises the user's own audits; insights teach broadly
  // applicable AEO/LLM strategy and contextually pitch Pro for whichever
  // topic-specific feature would help (Fix Generator, prompt simulator, etc).
  async sendWeeklyInsights(
    email: string,
    firstName: string,
    weekIndex: number,
    unsubscribeUrl?: string,
  ): Promise<boolean> {
    const { subject, html, text } = aeoInsightsEmail(firstName, weekIndex, unsubscribeUrl);
    return send(email, subject, html, text, "aeo-insights", unsubscribeUrl);
  },

  // Approaching-limit — fires once per (user, kind, month) when a free
  // user reaches cap-1. Earlier and softer than sendLimitReached; most
  // self-serve upgrades happen at this step, not at the wall.
  async sendApproachingLimit(
    email: string,
    firstName: string,
    kind: "audits" | "simulations",
    used: number,
    cap: number,
    unsubscribeUrl?: string,
  ): Promise<boolean> {
    const { subject, html, text } = approachingLimitEmail(firstName, kind, used, cap, unsubscribeUrl);
    return send(email, subject, html, text, `approaching-limit-${kind}`, unsubscribeUrl);
  },

  // "What you didn't see" — post-audit upsell for free users (NOT first
  // audit; that path uses sendFirstAudit). Throttled by caller to at
  // most once per 7 days via users.whatYouMissedSentAt. Shows what the
  // same audit looks like on Pro — engines + Fix Generator preview tied
  // to the user's actual hostname.
  async sendWhatYouMissed(
    email: string,
    firstName: string,
    url: string,
    geoScore: number,
    unsubscribeUrl?: string,
  ): Promise<boolean> {
    const { subject, html, text } = whatYouMissedEmail(firstName, url, geoScore, unsubscribeUrl);
    return send(email, subject, html, text, "what-you-missed", unsubscribeUrl);
  },

  // Score-Changed — fires after a re-audit when the score moves ±5 pts on
  // the same domain. Improved = celebration; declined = diagnostic. Strong
  // engagement signal because the user just opted in to running the audit
  // again of their own volition.
  async sendScoreChanged(
    email: string,
    firstName: string,
    url: string,
    previousScore: number,
    currentScore: number,
    topRecommendation: string | null,
    auditId?: string | null,
    unsubscribeUrl?: string,
  ): Promise<boolean> {
    const { subject, html, text } = scoreChangedEmail(
      firstName,
      url,
      previousScore,
      currentScore,
      topRecommendation,
      auditId,
      unsubscribeUrl,
    );
    return send(email, subject, html, text, "score-changed", unsubscribeUrl);
  },

  // ── Admin notifications ────────────────────────────────────────────────
  // These go to every address in ADMIN_EMAILS. They are operational alerts
  // (signups, upgrades, contact-form messages) — NOT marketing — so they
  // intentionally have no unsubscribe link. Failures are logged but never
  // bubble up: a Postmark hiccup must not block a user signup or an upgrade
  // webhook.
  async sendAdminNotification(subject: string, lines: string[]): Promise<void> {
    const recipients = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    if (recipients.length === 0) {
      logger.warn({ subject }, "ADMIN_EMAILS not set — skipping admin notification");
      return;
    }
    const text = lines.join("\n");
    // Render each line as either a "Key: Value" row (when the line contains
    // a colon) or a paragraph. Two-column layout makes admins skim 5x faster
    // than a wall of text and keeps the operational categories (User ID,
    // Plan, Amount) visually separated from prose.
    const rows = lines.map((raw) => {
      if (!raw) return `<tr><td colspan="2" style="height:6px;"></td></tr>`;
      const idx = raw.indexOf(":");
      if (idx > 0 && idx < raw.length - 1) {
        const key = raw.slice(0, idx).trim();
        const val = raw.slice(idx + 1).trim();
        return `<tr>
          <td style="padding:4px 12px 4px 0;color:#6b7280;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;white-space:nowrap;vertical-align:top;">${escapeHtml(key)}</td>
          <td style="padding:4px 0;color:#111827;font-size:14px;word-break:break-word;">${escapeHtml(val)}</td>
        </tr>`;
      }
      return `<tr><td colspan="2" style="padding:6px 0;color:#374151;font-size:14px;line-height:1.55;">${escapeHtml(raw)}</td></tr>`;
    }).join("");
    const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.5;color:#111;max-width:560px;">
  <div style="font-size:13px;color:#6b7280;margin-bottom:12px;">${escapeHtml(subject)}</div>
  <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${rows}</table>
</div>`;
    await Promise.all(
      recipients.map((to) => send(to, subject, html, text, "admin-notification")),
    );
  },

  async sendReferralReward(
    to: string,
    firstName: string,
    amountDollars: number,
    unsubscribeUrl?: string,
  ): Promise<boolean> {
    const { subject, html, text } = referralRewardEmail(firstName, amountDollars, unsubscribeUrl);
    return send(to, subject, html, text, "referral-reward", unsubscribeUrl);
  },

  async sendReferralRewardPending(
    to: string,
    firstName: string,
    amountDollars: number,
    unsubscribeUrl?: string,
  ): Promise<boolean> {
    const { subject, html, text } = referralRewardPendingEmail(firstName, amountDollars, undefined, unsubscribeUrl);
    return send(to, subject, html, text, "referral-reward-pending", unsubscribeUrl);
  },

  async sendContactForm(
    fromEmail: string,
    fromName: string,
    message: string,
    meta: { userId?: string | null; userPlan?: string | null; userAgent?: string | null },
  ): Promise<void> {
    const recipients = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.includes("@"));
    if (recipients.length === 0) {
      logger.warn({ fromEmail }, "ADMIN_EMAILS not set — skipping contact form forward");
      return;
    }
    const subject = `[Contact] ${fromName || fromEmail}`;
    const headerLines = [
      `From: ${fromName ? `${fromName} <${fromEmail}>` : fromEmail}`,
      meta.userId ? `User ID: ${meta.userId} (${meta.userPlan || "unknown plan"})` : "Not signed in",
      meta.userAgent ? `User-Agent: ${meta.userAgent}` : "",
      "",
      "Message:",
      message,
    ].filter(Boolean);
    const text = headerLines.join("\n");
    const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.5;color:#111">
<div><b>From:</b> ${escapeHtml(fromName || "")} &lt;${escapeHtml(fromEmail)}&gt;</div>
${meta.userId ? `<div><b>User:</b> ${escapeHtml(meta.userId)} (${escapeHtml(meta.userPlan || "unknown")})</div>` : "<div><b>User:</b> not signed in</div>"}
${meta.userAgent ? `<div><b>UA:</b> ${escapeHtml(meta.userAgent)}</div>` : ""}
<hr style="border:none;border-top:1px solid #ddd;margin:12px 0" />
<div style="white-space:pre-wrap">${escapeHtml(message)}</div>
</div>`;
    await Promise.all(
      recipients.map((to) =>
        // Set ReplyTo via a one-off Postmark call so the admin can reply
        // straight to the user instead of to info@aeoimprovement.com.
        sendWithReplyTo(to, subject, html, text, "contact-form", fromEmail),
      ),
    );
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendWithReplyTo(
  to: string,
  subject: string,
  html: string,
  text: string,
  tag: string,
  replyTo: string,
): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  try {
    await client.sendEmail({
      From: FROM_EMAIL,
      To: to,
      ReplyTo: replyTo,
      Subject: subject,
      HtmlBody: html,
      TextBody: text,
      MessageStream: "outbound",
      Tag: tag,
    });
    logger.info({ to, tag }, "Email sent");
    return true;
  } catch (err: any) {
    logger.error({ err: err?.message, to, tag }, "Email send failed");
    return false;
  }
}
