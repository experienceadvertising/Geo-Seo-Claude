const BASE_URL = process.env.FRONTEND_URL || "https://aeoimprovement.com";
const BRAND_COLOR = "#10b981";

/**
 * HTML-escape a string for safe interpolation into email markup. Use for
 * ANY value that originates from user input (firstName, url) or LLM
 * output (recommendations, brand names) before placing it inside HTML.
 * Without this, a user who signs up with a name like `<script>` or an
 * LLM that emits stray angle brackets can break our email layout or
 * inject content into recipients' inboxes.
 */
function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(content: string, preheader: string, unsubscribeUrl?: string): string {
  const unsubscribeLink = unsubscribeUrl
    ? `<a href="${unsubscribeUrl}" style="color:#d1d5db;text-decoration:underline;">Unsubscribe</a> · `
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AEO Improvement</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="background:linear-gradient(135deg,#064e3b,#065f46);border-radius:12px 12px 0 0;padding:28px 40px;text-align:center;">
            <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
              ✦ AEO Improvement
            </span>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
            ${content}
          </td>
        </tr>

        <tr>
          <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">
              AEO Improvement · <a href="${BASE_URL}" style="color:${BRAND_COLOR};text-decoration:none;">aeoimprovement.com</a>
            </p>
            <p style="margin:0;font-size:11px;color:#d1d5db;">
              ${unsubscribeLink}<a href="mailto:info@aeoimprovement.com" style="color:#d1d5db;text-decoration:underline;">Contact support</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;margin-top:8px;">${label}</a>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#111827;line-height:1.25;">${text}</h1>`;
}

function p(text: string, styles = ""): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;${styles}">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />`;
}

function feature(icon: string, title: string, desc: string): string {
  return `<tr>
    <td style="padding:10px 0;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="width:40px;vertical-align:top;font-size:22px;padding-top:2px;">${icon}</td>
        <td>
          <div style="font-size:15px;font-weight:600;color:#111827;margin-bottom:2px;">${title}</div>
          <div style="font-size:14px;color:#6b7280;line-height:1.5;">${desc}</div>
        </td>
      </tr></table>
    </td>
  </tr>`;
}

function scoreBar(label: string, score: number): string {
  const pct = Math.round(Math.min(100, Math.max(0, score)));
  const color = pct >= 75 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
  return `<tr>
    <td style="padding:6px 0;">
      <div style="font-size:13px;font-weight:500;color:#374151;margin-bottom:4px;">${label}</div>
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#f3f4f6;border-radius:4px;height:8px;overflow:hidden;">
          <div style="width:${pct}%;background:${color};height:8px;border-radius:4px;"></div>
        </td>
        <td style="width:40px;text-align:right;font-size:12px;font-weight:600;color:${color};padding-left:8px;">${pct}</td>
      </tr></table>
    </td>
  </tr>`;
}

// ── Email 1: Welcome (Day 0) ─────────────────────────────────────────────────
export function welcomeEmail(firstName: string, unsubscribeUrl?: string) {
  const subject = `Welcome to AEO Improvement, ${firstName || "there"}!`;
  const html = layout(
    `${h1(`Welcome, ${firstName || "there"} 👋`)}
    ${p("You're now set up to track and improve your website's citability across ChatGPT, Claude, Gemini, and Perplexity.")}
    ${p("Here's what to do next:")}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;">
      ${feature("🔍", "Run your first audit", "Enter your website URL and get an instant AEO score with specific recommendations.")}
      ${feature("📋", "Read your quick wins", "Every audit highlights the highest-impact fixes you can make today.")}
      ${feature("🤖", "Check AI engine access", "See exactly which AI bots can crawl your site and what's blocking them.")}
    </table>

    <div style="text-align:center;margin:32px 0;">
      ${btn("Run my first audit →", BASE_URL)}
    </div>

    ${divider()}
    ${p("Questions? Just reply to this email — we read every one.", "color:#6b7280;font-size:14px;")}`,
    "You're set up. Run your first AEO audit now →",
    unsubscribeUrl,
  );
  const text = `Welcome to AEO Improvement!\n\nYou're now set up to track and improve your citability across ChatGPT, Claude, Gemini, and Perplexity.\n\nRun your first audit: ${BASE_URL}\n\nQuestions? Reply to this email.`;
  return { subject, html, text };
}

// ── Email 2: Day-3 Tips ──────────────────────────────────────────────────────
export function welcomeD3Email(firstName: string, unsubscribeUrl?: string) {
  const subject = "3 quick AEO wins you can do this week";
  const html = layout(
    `${h1("3 quick wins for better AI citations")}
    ${p(`Hi ${firstName || "there"}, it's been a few days since you signed up. Here are three high-impact improvements most sites can make this week:`)}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;">
      ${feature("1️⃣", "Add an llms.txt file", "A plain-text summary of your site at /llms.txt tells AI systems exactly who you are and what you do. It takes 10 minutes and boosts citability across every engine.")}
      ${feature("2️⃣", "Add FAQ schema markup", "AI engines love structured Q&A. Add <code style='font-size:12px;background:#f3f4f6;padding:1px 4px;border-radius:3px;'>FAQPage</code> JSON-LD to your top pages. Our Fix Generator writes it for you.")}
      ${feature("3️⃣", "Open your robots.txt to AI bots", "Many sites accidentally block GPTBot and ClaudeBot. Check your audit's Crawler Access section — one line in robots.txt can unlock all four engines.")}
    </table>

    <div style="text-align:center;margin:32px 0;">
      ${btn("View my audit & apply fixes →", BASE_URL)}
    </div>

    ${divider()}
    ${p("The Fix Generator (Pro) writes your llms.txt, JSON-LD, and robots.txt patches automatically — copy and deploy in minutes.", "color:#6b7280;font-size:13px;")}`,
    "3 high-impact improvements most sites can make this week →",
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\n3 quick AEO wins:\n\n1. Add an llms.txt file at /llms.txt\n2. Add FAQPage JSON-LD schema\n3. Open robots.txt to AI bots (GPTBot, ClaudeBot)\n\nSee your audit: ${BASE_URL}\n\nThe Fix Generator (Pro) creates all of these for you automatically.`;
  return { subject, html, text };
}

// ── Email 3: Day-7 Upgrade Prompt ────────────────────────────────────────────
export function welcomeD7Email(firstName: string, unsubscribeUrl?: string) {
  const subject = "What Pro unlocks for your AEO strategy";
  const html = layout(
    `${h1("Ready to go deeper?")}
    ${p(`Hi ${firstName || "there"}, you've had a week with AEO Improvement. Here's what upgrading to Pro unlocks:`)}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;background:#f0fdf4;border-radius:8px;padding:16px;">
      ${feature("✦", "All 4 AI engines", "Run simulations against ChatGPT, Claude, Gemini, and Perplexity — not just ChatGPT.")}
      ${feature("🔧", "Fix Generator", "Auto-generate your llms.txt, JSON-LD schema, and robots.txt patches. Copy and deploy in minutes.")}
      ${feature("📊", "Competitor citation gaps", "See exactly which competitors are being cited instead of you — and why.")}
      ${feature("📈", "1-year trend history", "Track your AEO score over time and see the impact of every improvement.")}
      ${feature("💬", "Sentiment analysis", "Understand how AI engines perceive your brand — positive, neutral, or negative.")}
    </table>

    <div style="text-align:center;margin:32px 0;">
      ${btn("Upgrade to Pro — $79/mo →", `${BASE_URL}/pricing`)}
    </div>

    ${p("Cancel anytime. No long-term contracts.", "color:#9ca3af;font-size:13px;text-align:center;")}`,
    "Here's what Pro unlocks for your AEO strategy →",
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\nHere's what Pro unlocks:\n- All 4 AI engines (Claude, Gemini, Perplexity)\n- Fix Generator (llms.txt, JSON-LD, robots.txt)\n- Competitor citation gap table\n- 1-year history & sentiment analysis\n\nUpgrade: ${BASE_URL}/pricing\n\nCancel anytime.`;
  return { subject, html, text };
}

// ── Email 4: Weekly Digest (Pro+) ────────────────────────────────────────────
export interface WeeklyDigestData {
  firstName: string;
  latestAudit?: {
    url: string;
    geoScore: number;
    quickWins: string[];
    createdAt: Date;
  };
  auditCount: number;
}

export function weeklyDigestEmail(data: WeeklyDigestData, unsubscribeUrl?: string) {
  const { firstName, latestAudit, auditCount } = data;
  const subject = `Your AEO weekly digest`;
  const scoreSection = latestAudit
    ? `${divider()}
      <div style="margin-bottom:16px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Latest Audit Score</div>
      <table cellpadding="0" cellspacing="0" width="100%">
        ${scoreBar("AEO Score", latestAudit.geoScore * 100)}
      </table>
      ${latestAudit.quickWins.length > 0 ? `
        <div style="margin:20px 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Top Quick Wins</div>
        <ul style="margin:0;padding:0 0 0 20px;font-size:14px;line-height:1.8;color:#374151;">
          ${latestAudit.quickWins.slice(0, 3).map(w => `<li>${w}</li>`).join("")}
        </ul>` : ""}
      <div style="margin-top:24px;text-align:center;">
        ${btn("View full audit →", `${BASE_URL}`)}
      </div>`
    : `${p("You haven't run an audit yet this week. Run one now to track your progress.")}
      <div style="text-align:center;margin-top:24px;">
        ${btn("Run an audit →", BASE_URL)}
      </div>`;

  const html = layout(
    `${h1(`Your weekly AEO update`)}
    ${p(`Hi ${firstName || "there"}, here's your AEO Improvement digest for the week.`)}
    <table cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf4;border-radius:8px;margin:16px 0;">
      <tr>
        <td style="padding:20px;text-align:center;">
          <div style="font-size:36px;font-weight:800;color:${BRAND_COLOR};">${auditCount}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px;">audit${auditCount !== 1 ? "s" : ""} this week</div>
        </td>
      </tr>
    </table>
    ${scoreSection}`,
    `Your weekly AEO Improvement digest — ${auditCount} audit${auditCount !== 1 ? "s" : ""} this week`,
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"}, your AEO weekly digest:\n\nAudits this week: ${auditCount}\n${latestAudit ? `Latest AEO score: ${Math.round(latestAudit.geoScore * 100)}\nTop quick win: ${latestAudit.quickWins[0] || "none"}\n` : ""}\nView your dashboard: ${BASE_URL}`;
  return { subject, html, text };
}

// ── Email: Email Verification (transactional — no unsubscribe) ────────────────
export function verificationEmail(firstName: string, verifyUrl: string) {
  const subject = "Verify your AEO Improvement email address";
  const html = layout(
    `${h1("Confirm your email")}
    ${p(`Hi ${firstName || "there"}, welcome to AEO Improvement! Just click the button below to verify your email address and activate your free account.`)}
    <div style="text-align:center;margin:32px 0;">
      ${btn("Verify my email →", verifyUrl)}
    </div>
    ${divider()}
    ${p("This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.", "color:#6b7280;font-size:13px;")}
    ${p(`Or copy this link into your browser:<br/><a href="${verifyUrl}" style="color:${BRAND_COLOR};word-break:break-all;font-size:12px;">${verifyUrl}</a>`, "color:#6b7280;font-size:12px;")}`,
    "Verify your email to activate your AEO Improvement account →",
  );
  const text = `Hi ${firstName || "there"},\n\nVerify your AEO Improvement email address by visiting:\n${verifyUrl}\n\nThis link expires in 24 hours. If you didn't create an account, you can safely ignore this email.`;
  return { subject, html, text };
}

// ── Email: Password Reset (transactional — no unsubscribe) ────────────────────
export function passwordResetEmail(firstName: string, resetUrl: string) {
  const subject = "Reset your AEO Improvement password";
  const html = layout(
    `${h1("Reset your password")}
    ${p(`Hi ${firstName || "there"}, we received a request to reset your AEO Improvement password. Click the button below to choose a new one.`)}
    <div style="text-align:center;margin:32px 0;">
      ${btn("Reset my password →", resetUrl)}
    </div>
    ${divider()}
    ${p("This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.", "color:#6b7280;font-size:13px;")}
    ${p(`Or copy this link into your browser:<br/><a href="${resetUrl}" style="color:${BRAND_COLOR};word-break:break-all;font-size:12px;">${resetUrl}</a>`, "color:#6b7280;font-size:12px;")}`,
    "Reset your AEO Improvement password →",
  );
  const text = `Hi ${firstName || "there"},\n\nReset your AEO Improvement password by visiting:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email — your password won't change.`;
  return { subject, html, text };
}

// ── Email: Password Changed (transactional — security notification) ───────────
export function passwordChangedEmail(firstName: string, supportUrl: string) {
  const subject = "Your AEO Improvement password was just changed";
  const html = layout(
    `${h1("Your password was changed")}
    ${p(`Hi ${firstName || "there"}, this is a confirmation that the password for your AEO Improvement account was just changed.`)}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;background:#fefce8;border-radius:8px;">
      <tr><td style="padding:16px 20px;font-size:14px;color:#713f12;">
        <strong>Didn't make this change?</strong><br/>
        Reset your password immediately and contact us at info@aeoimprovement.com — your account may be compromised.
      </td></tr>
    </table>
    <div style="text-align:center;margin:24px 0;">
      ${btn("Reset password →", `${BASE_URL}/forgot-password`)}
    </div>
    ${divider()}
    ${p(`If you made this change, no further action is needed.`, "color:#6b7280;font-size:13px;")}`,
    "Confirmation: your AEO Improvement password was just changed.",
  );
  const text = `Hi ${firstName || "there"},\n\nThis is a confirmation that the password for your AEO Improvement account was just changed.\n\nDidn't make this change? Reset your password immediately at ${BASE_URL}/forgot-password and contact info@aeoimprovement.com.`;
  return { subject, html, text };
}

// ── Email: Payment Failed (transactional — billing) ───────────────────────────
export function paymentFailedEmail(firstName: string, attemptCount: number, nextRetryAt?: Date | null) {
  const subject = "Action needed: payment failed for AEO Improvement";
  const retryLine = nextRetryAt
    ? `We'll automatically retry on ${nextRetryAt.toLocaleDateString("en-US", { month: "long", day: "numeric" })}.`
    : "We'll automatically retry over the next few days.";
  const html = layout(
    `${h1("Your payment didn't go through")}
    ${p(`Hi ${firstName || "there"}, we tried to charge your card for your AEO Improvement subscription and it was declined.`)}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;background:#fef2f2;border-radius:8px;">
      <tr><td style="padding:16px 20px;font-size:14px;color:#7f1d1d;">
        <strong>Attempt ${attemptCount} failed.</strong> ${retryLine} If we can't collect payment, your account will be moved to the free plan.
      </td></tr>
    </table>
    ${p("Please update your payment method to keep access to:")}
    <ul style="margin:0 0 16px 0;padding:0 0 0 20px;font-size:14px;line-height:1.8;color:#374151;">
      <li>All 4 AI engines (ChatGPT, Claude, Gemini, Perplexity)</li>
      <li>Fix Generator and competitor citation gap reports</li>
      <li>1-year trend history and sentiment analysis</li>
    </ul>
    <div style="text-align:center;margin:24px 0;">
      ${btn("Update payment method →", `${BASE_URL}/pricing`)}
    </div>
    ${divider()}
    ${p("Questions about your bill? Just reply to this email.", "color:#6b7280;font-size:13px;")}`,
    "Action needed: your AEO Improvement payment was declined.",
  );
  const text = `Hi ${firstName || "there"},\n\nWe tried to charge your card for your AEO Improvement subscription and it was declined (attempt ${attemptCount}).\n\n${retryLine} If we can't collect payment, your account will be moved to the free plan.\n\nUpdate payment method: ${BASE_URL}/pricing\n\nQuestions? Reply to this email.`;
  return { subject, html, text };
}

// ── Email: Subscription Canceled (transactional — billing) ────────────────────
export function subscriptionCanceledEmail(firstName: string, planName: string) {
  const subject = "Your AEO Improvement subscription has ended";
  const html = layout(
    `${h1("Your subscription has ended")}
    ${p(`Hi ${firstName || "there"}, your AEO Improvement <strong>${planName}</strong> subscription has been canceled. Your account is now on the free plan.`)}
    ${p("You can still:")}
    <ul style="margin:0 0 16px 0;padding:0 0 0 20px;font-size:14px;line-height:1.8;color:#374151;">
      <li>Run AEO audits (3 prompts each, ChatGPT only)</li>
      <li>View your audit history</li>
      <li>Re-subscribe at any time</li>
    </ul>
    <div style="text-align:center;margin:24px 0;">
      ${btn("Resubscribe →", `${BASE_URL}/pricing`)}
    </div>
    ${divider()}
    ${p("Mind sharing why you canceled? Just reply to this email — your feedback shapes what we build next.", "color:#6b7280;font-size:13px;")}`,
    "Your AEO Improvement subscription has been canceled.",
  );
  const text = `Hi ${firstName || "there"},\n\nYour AEO Improvement ${planName} subscription has been canceled. Your account is now on the free plan.\n\nResubscribe anytime: ${BASE_URL}/pricing\n\nMind sharing why? Just reply.`;
  return { subject, html, text };
}

// ── Email 5: Monthly Report (Agency) ─────────────────────────────────────────
export interface MonthlyReportData {
  firstName: string;
  month: string;
  totalAudits: number;
  avgScore: number;
  bestScore: number;
  topUrl: string;
  quickWins: string[];
}

export function monthlyReportEmail(data: MonthlyReportData, unsubscribeUrl?: string) {
  const { firstName, month, totalAudits, avgScore, bestScore, topUrl, quickWins } = data;
  const subject = `Your AEO monthly report — ${month}`;
  const html = layout(
    `${h1(`Monthly AEO Report — ${month}`)}
    ${p(`Hi ${firstName || "there"}, here's a summary of your AEO performance for ${month}.`)}

    ${divider()}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;">
      <tr>
        <td style="width:33%;text-align:center;padding:16px;background:#f9fafb;border-radius:8px;margin:4px;">
          <div style="font-size:32px;font-weight:800;color:${BRAND_COLOR};">${totalAudits}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Total Audits</div>
        </td>
        <td style="width:4%;"></td>
        <td style="width:33%;text-align:center;padding:16px;background:#f9fafb;border-radius:8px;">
          <div style="font-size:32px;font-weight:800;color:${BRAND_COLOR};">${Math.round(avgScore)}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Avg AEO Score</div>
        </td>
        <td style="width:4%;"></td>
        <td style="width:33%;text-align:center;padding:16px;background:#f9fafb;border-radius:8px;">
          <div style="font-size:32px;font-weight:800;color:${BRAND_COLOR};">${Math.round(bestScore)}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px;">Best Score</div>
        </td>
      </tr>
    </table>

    ${topUrl ? `<div style="margin:16px 0;font-size:13px;color:#6b7280;">Best performing site: <strong style="color:#111827;">${topUrl}</strong></div>` : ""}

    ${quickWins.length > 0 ? `
      ${divider()}
      <div style="margin-bottom:12px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Top Opportunities This Month</div>
      <ul style="margin:0;padding:0 0 0 20px;font-size:14px;line-height:1.9;color:#374151;">
        ${quickWins.slice(0, 5).map(w => `<li>${w}</li>`).join("")}
      </ul>` : ""}

    <div style="text-align:center;margin:32px 0;">
      ${btn("View full dashboard →", BASE_URL)}
    </div>

    ${divider()}
    ${p("This report is sent monthly to Agency plan subscribers. Upgrade or manage your plan at any time.", "color:#9ca3af;font-size:12px;")}`,
    `Your AEO monthly performance report for ${month} — ${totalAudits} audits, avg score ${Math.round(avgScore)}`,
    unsubscribeUrl,
  );
  const text = `Monthly AEO Report — ${month}\n\nHi ${firstName || "there"},\n\nTotal audits: ${totalAudits}\nAvg AEO score: ${Math.round(avgScore)}\nBest score: ${Math.round(bestScore)}\n${topUrl ? `Best site: ${topUrl}\n` : ""}${quickWins.length > 0 ? `\nTop opportunities:\n${quickWins.slice(0, 5).map(w => `- ${w}`).join("\n")}` : ""}\n\nView dashboard: ${BASE_URL}`;
  return { subject, html, text };
}

// ── Email: Limit Reached (free tier upsell) ──────────────────────────────────
// Sent at most once per kind per month — the caller (usageLimits.checkQuota)
// uses an atomic "claim" to ensure firstDenial is only true once per month
// per (user, kind). Crucial for not spamming users who retry repeatedly.
export function limitReachedEmail(
  firstName: string,
  kind: "audits" | "simulations",
  cap: number,
  unsubscribeUrl?: string,
) {
  const kindLabel = kind === "audits" ? "audit" : "prompt simulation";
  const safeFirstName = esc(firstName) || "there";
  const subject = `You've used all ${cap} free ${kindLabel}s this month`;
  const proBenefit = kind === "audits"
    ? "100 audits/month, full AI insights, Fix Generator, competitor citation gap reports"
    : "30 prompt simulations/month with all 4 engines (ChatGPT, Claude, Gemini, Perplexity), 25 prompts each";
  const html = layout(
    `${h1(`You hit your free ${kindLabel} limit 🎯`)}
    ${p(`Hi ${safeFirstName}, nice work — you've used all ${cap} of your free ${kindLabel}s this month. Your quota will refill on the 1st.`)}
    ${p(`If you don't want to wait, the <strong>Pro plan</strong> unlocks:`)}
    <ul style="margin:0 0 16px 0;padding:0 0 0 20px;font-size:14px;line-height:1.8;color:#374151;">
      <li>${proBenefit}</li>
      <li>Sentiment & tone analysis across all 4 engines</li>
      <li>1-year visibility trend history</li>
      <li>Priority email support</li>
    </ul>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0;">
      <tr><td style="padding:18px 20px;font-size:14px;color:#065f46;text-align:center;">
        <strong>Pro: $79/mo</strong> · or <strong>$62.50/mo billed annually</strong> (save 21%)
      </td></tr>
    </table>
    <div style="text-align:center;margin:24px 0;">
      ${btn("Upgrade to Pro →", `${BASE_URL}/pricing`)}
    </div>
    ${divider()}
    ${p(`Not ready to upgrade? Your free quota refills automatically on the 1st of next month.`, "color:#6b7280;font-size:13px;")}`,
    `You've used all ${cap} free ${kindLabel}s this month. Upgrade to Pro for ${kind === "audits" ? "100 audits" : "30 simulations"}/mo.`,
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\nYou've used all ${cap} of your free ${kindLabel}s this month. Your quota refills on the 1st.\n\nWant more now? Upgrade to Pro ($79/mo, or $62.50/mo billed annually) for:\n- ${proBenefit}\n- Sentiment analysis\n- 1-year history\n- Priority support\n\nUpgrade: ${BASE_URL}/pricing`;
  return { subject, html, text };
}

// ── Email: First Audit Complete (engagement / activation) ─────────────────────
// Fires exactly once, the first time a user completes any audit. The "first
// audit" moment is the strongest engagement window — they've experienced
// value, now we show them what's next.
export function firstAuditEmail(
  firstName: string,
  url: string,
  geoScore: number,
  topRecommendation: string | null,
  unsubscribeUrl?: string,
) {
  const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  const safeHostname = esc(hostname);
  const safeFirstName = esc(firstName) || "there";
  const safeTopRec = esc(topRecommendation);
  const scoreColor = geoScore >= 75 ? "#10b981" : geoScore >= 50 ? "#f59e0b" : "#ef4444";
  const scoreVerdict = geoScore >= 75 ? "you're already ahead of most sites" : geoScore >= 50 ? "you've got a solid foundation with clear room to grow" : "there's significant upside available";
  // Subject is plain text (Postmark handles encoding) but URL/host segment
  // is bounded to hostname only above to avoid header-injection surface.
  const subject = `Your first AEO audit is in — ${hostname} scored ${Math.round(geoScore)}/100`;
  const html = layout(
    `${h1(`Your first audit is done 🎉`)}
    ${p(`Hi ${safeFirstName}, you just ran your first AEO audit on <strong>${safeHostname}</strong>. Here's the headline:`)}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background:#f9fafb;border-radius:12px;">
      <tr><td style="padding:24px;text-align:center;">
        <div style="font-size:48px;font-weight:800;color:${scoreColor};line-height:1;">${Math.round(geoScore)}<span style="font-size:24px;color:#9ca3af;">/100</span></div>
        <div style="font-size:13px;color:#6b7280;margin-top:6px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">AEO Score</div>
      </td></tr>
    </table>

    ${p(`At ${Math.round(geoScore)}/100, ${scoreVerdict}.`)}

    ${safeTopRec ? `
      <div style="margin:20px 0;padding:18px 20px;background:#ecfdf5;border-left:4px solid ${BRAND_COLOR};border-radius:6px;">
        <div style="font-size:12px;font-weight:600;color:${BRAND_COLOR};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Top opportunity</div>
        <div style="font-size:14px;color:#374151;line-height:1.6;">${safeTopRec}</div>
      </div>
    ` : ""}

    ${p("To go deeper, here are the most useful next steps:")}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;">
      ${feature("🔬", "Run a prompt simulation", "See how ChatGPT, Claude, Gemini and Perplexity actually answer when someone asks about your brand.")}
      ${feature("📊", "Compare to competitors", "Run audits on 2–3 competitors to find your AEO gaps.")}
      ${feature("🛠", "Generate fixes", "Pro users get auto-generated llms.txt, JSON-LD schema, and robots.txt for their site.")}
    </table>

    <div style="text-align:center;margin:24px 0;">
      ${btn("Open your audit →", `${BASE_URL}/`)}
    </div>

    ${divider()}
    ${p("Hit your free quota? Pro unlocks 100 audits, 30 prompt simulations, and the Fix Generator — $79/mo (or $62.50/mo annual).", "color:#6b7280;font-size:13px;")}`,
    `Your first audit on ${hostname} scored ${Math.round(geoScore)}/100 — here's what to do next.`,
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\nYou just ran your first AEO audit on ${hostname}. Score: ${Math.round(geoScore)}/100 — ${scoreVerdict}.\n\n${topRecommendation ? `Top opportunity: ${topRecommendation}\n\n` : ""}Next steps:\n- Run a prompt simulation to see how AI engines answer about your brand\n- Audit 2-3 competitors to find your gaps\n- Pro users get auto-generated llms.txt + JSON-LD schema\n\nOpen your audit: ${BASE_URL}/`;
  return { subject, html, text };
}
