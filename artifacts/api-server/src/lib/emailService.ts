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
  type WeeklyDigestData,
  type MonthlyReportData,
} from "./emailTemplates";

const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "AEO Improvement <info@aeoimprovement.com>";

function getClient(): postmark.ServerClient | null {
  const token = process.env.POSTMARK_API_TOKEN;
  if (!token) {
    logger.warn("POSTMARK_API_TOKEN not set — email sending disabled");
    return null;
  }
  return new postmark.ServerClient(token);
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

  async sendWelcomeD3(email: string, firstName: string, unsubscribeUrl?: string): Promise<boolean> {
    const { subject, html, text } = welcomeD3Email(firstName, unsubscribeUrl);
    return send(email, subject, html, text, "welcome-d3", unsubscribeUrl);
  },

  async sendWelcomeD7(email: string, firstName: string, unsubscribeUrl?: string): Promise<boolean> {
    const { subject, html, text } = welcomeD7Email(firstName, unsubscribeUrl);
    return send(email, subject, html, text, "welcome-d7", unsubscribeUrl);
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
};
