import * as postmark from "postmark";
import { logger } from "./logger";
import {
  welcomeEmail,
  welcomeD3Email,
  welcomeD7Email,
  weeklyDigestEmail,
  monthlyReportEmail,
  type WeeklyDigestData,
  type MonthlyReportData,
} from "./emailTemplates";

const FROM_EMAIL = "AEO Improvement <info@aeoimprovement.com>";

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
  tag: string
): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  if (!to || !to.includes("@")) {
    logger.warn({ to, tag }, "Skipping email — invalid address");
    return false;
  }
  try {
    await client.sendEmail({
      From: FROM_EMAIL,
      To: to,
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

export const EmailService = {
  async sendWelcome(email: string, firstName: string): Promise<boolean> {
    const { subject, html, text } = welcomeEmail(firstName);
    return send(email, subject, html, text, "welcome");
  },

  async sendWelcomeD3(email: string, firstName: string): Promise<boolean> {
    const { subject, html, text } = welcomeD3Email(firstName);
    return send(email, subject, html, text, "welcome-d3");
  },

  async sendWelcomeD7(email: string, firstName: string): Promise<boolean> {
    const { subject, html, text } = welcomeD7Email(firstName);
    return send(email, subject, html, text, "welcome-d7");
  },

  async sendWeeklyDigest(email: string, data: WeeklyDigestData): Promise<boolean> {
    const { subject, html, text } = weeklyDigestEmail(data);
    return send(email, subject, html, text, "weekly-digest");
  },

  async sendMonthlyReport(email: string, data: MonthlyReportData): Promise<boolean> {
    const { subject, html, text } = monthlyReportEmail(data);
    return send(email, subject, html, text, "monthly-report");
  },
};
