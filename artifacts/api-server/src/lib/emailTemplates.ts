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
    ? `<a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Manage email preferences</a> &middot; `
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AEO Improvement</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="background:linear-gradient(140deg,#064e3b 0%,#065f46 55%,#047857 100%);border-radius:16px 16px 0 0;padding:32px 40px 26px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 10px;">
              <tr>
                <td style="vertical-align:middle;padding-right:10px;">
                  <div style="width:38px;height:38px;background:rgba(255,255,255,0.15);border-radius:10px;text-align:center;line-height:38px;font-size:18px;display:inline-block;">✦</div>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">AEO Improvement</span>
                </td>
              </tr>
            </table>
            <div style="font-size:12px;color:rgba(255,255,255,0.55);letter-spacing:0.04em;text-transform:uppercase;">Answer Engine Optimization</div>
          </td>
        </tr>

        <tr>
          <td style="height:3px;background:linear-gradient(90deg,#10b981,#06b6d4);"></td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:44px 40px 36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            ${content}
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
              AEO Improvement &middot; <a href="${BASE_URL}" style="color:${BRAND_COLOR};text-decoration:none;">aeoimprovement.com</a>
            </p>
            <p style="margin:0;font-size:11px;color:#cbd5e1;">
              ${unsubscribeLink}<a href="mailto:info@aeoimprovement.com" style="color:#cbd5e1;text-decoration:underline;">Contact support</a>
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
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;margin-top:8px;box-shadow:0 4px 14px rgba(16,185,129,0.3);">${label}</a>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#111827;line-height:1.25;">${text}</h1>`;
}

function p(text: string, styles = ""): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#374151;${styles}">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />`;
}

function feature(icon: string, title: string, desc: string): string {
  return `<tr>
    <td style="padding:10px 0;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="width:46px;vertical-align:top;padding-top:2px;">
          <div style="width:36px;height:36px;background:#ecfdf5;border-radius:10px;text-align:center;line-height:36px;font-size:18px;">${icon}</div>
        </td>
        <td style="padding-left:4px;">
          <div style="font-size:15px;font-weight:600;color:#111827;margin-bottom:3px;">${title}</div>
          <div style="font-size:14px;color:#6b7280;line-height:1.55;">${desc}</div>
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
  // Subject leads with the value prop ("first audit") rather than a generic
  // greeting — Gmail truncates after ~50 chars on mobile, so the action
  // verb has to land in the first words.
  const subject = firstName
    ? `${firstName}, your free core-feature month starts now`
    : `Your free core-feature month starts now`;
  const html = layout(
    `${h1(`Welcome, ${firstName || "there"} 👋`)}
    ${p("You're now set up to track and improve your website's citability across ChatGPT, Claude, Gemini, and Perplexity.")}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0;">
      <tr><td style="padding:18px 20px;font-size:14px;color:#065f46;">
        <strong>Your first month is completely free with all core audit features unlocked.</strong><br/>
        All 4 AI engines, the Fix Generator, competitor tracking, continuous monitoring, sentiment analysis. No credit card, nothing to activate. It is already on.
      </td></tr>
    </table>
    ${p("Here's how to make the most of it:")}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;">
      ${feature("🔍", "Run your first audit", "Enter your website URL and get an instant AEO score with specific recommendations.")}
      ${feature("🔬", "Simulate across all 4 engines", "See whether ChatGPT, Claude, Gemini, and Perplexity actually cite you — all engines are unlocked for you.")}
      ${feature("🛠", "Generate your fixes", "The Fix Generator auto-drafts JSON-LD schema and citation-bot robots.txt patches, with llms.txt clearly labeled optional.")}
    </table>

    <div style="text-align:center;margin:32px 0;">
      ${btn("Run my first audit →", BASE_URL)}
    </div>

    ${divider()}
    ${p("Questions? Just reply to this email. We read every one.", "color:#6b7280;font-size:14px;")}`,
    "All core audit features are unlocked free for your first month. Run your first AEO audit now →",
    unsubscribeUrl,
  );
  const text = `Welcome to AEO Improvement!\n\nYour first month is completely free with all core audit features unlocked: all 4 AI engines, Fix Generator, competitor tracking, monitoring, and sentiment analysis. Connected GA4 reporting is available on paid plans. No credit card is needed for the free month.\n\nRun your first audit: ${BASE_URL}\n\nQuestions? Reply to this email.`;
  return { subject, html, text };
}

// ── Email 2: Day-3 Tips ──────────────────────────────────────────────────────
export function welcomeD3Email(firstName: string, hasAudit: boolean, unsubscribeUrl?: string) {
  // Concrete > clever: name the actions, not the category.
  const subject = hasAudit
    ? "Your next 3 AEO tasks: fresh dates, FAQ schema, robots.txt"
    : "Your free month is running — start with this 60-second audit";
  const html = layout(
    `${h1(hasAudit ? "3 quick wins for better AI citations" : "Start your optimization journey")}
    ${p(hasAudit ? `Hi ${firstName || "there"}, your first audit is in. Here are three high-impact improvements to check against its task list:` : `Hi ${firstName || "there"}, you still have all core audit features unlocked. Run your first audit now so we can build a prioritized, trackable optimization journey for your domain.`)}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;">
      ${feature("1️⃣", "Show a visible 'Last updated' date", "AI engines strongly prefer fresh content — the overwhelming majority of ChatGPT citations go to recently updated pages. Add a visible updated date (and dateModified schema) to your key pages, and actually refresh them.")}
      ${feature("2️⃣", "Add FAQ schema markup", "AI engines love structured Q&A. Add <code style='font-size:12px;background:#f3f4f6;padding:1px 4px;border-radius:3px;'>FAQPage</code> JSON-LD to your top pages. Our Fix Generator writes it for you.")}
      ${feature("3️⃣", "Open your robots.txt to AI search bots", "Many sites accidentally block OAI-SearchBot (ChatGPT Search), Claude-SearchBot, or PerplexityBot — the crawlers that decide whether you CAN be cited. Check your audit's Crawler Access section.")}
    </table>

    <div style="text-align:center;margin:32px 0;">
      ${btn(hasAudit ? "View my tasks & apply fixes →" : "Run my first audit →", BASE_URL)}
    </div>

    ${divider()}
    ${p("The Fix Generator, unlocked during your free first month, writes your JSON-LD and citation-bot robots.txt patches automatically. Copy and deploy in minutes.", "color:#6b7280;font-size:13px;")}`,
    "3 high-impact improvements most sites can make this week →",
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\n3 quick AEO wins:\n\n1. Show a visible "Last updated" date on key pages (AI engines strongly prefer fresh content)\n2. Add FAQPage JSON-LD schema\n3. Open robots.txt to AI search bots (OAI-SearchBot, Claude-SearchBot, PerplexityBot)\n\nSee your audit: ${BASE_URL}\n\nThe Fix Generator — unlocked during your free first month — creates the schema and robots.txt fixes for you automatically.`;
  return { subject, html, text };
}

// ── Email 3: Day-7 Check-in ──────────────────────────────────────────────────
// Recipients are one week into their free core-feature first month (paid users
// are excluded by the scheduler), so this is NOT an upgrade pitch — it's a
// "use the good stuff while it's free" nudge that seeds the upgrade decision.
export function welcomeD7Email(firstName: string, unsubscribeUrl?: string) {
  const subject = "One week in — the features worth trying before your free month ends";
  const html = layout(
    `${h1("You're one week into your free core-feature month")}
    ${p(`Hi ${firstName || "there"}, everything below is already unlocked on your account — no upgrade needed. These are the features users tell us move the needle most:`)}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;background:#f0fdf4;border-radius:8px;padding:16px;">
      ${feature("✦", "All 4 AI engines", "Run simulations against ChatGPT, Claude, Gemini, and Perplexity — not just one.")}
      ${feature("🔧", "Fix Generator", "Auto-generate JSON-LD schema and citation-bot robots.txt patches. Copy and deploy in minutes.")}
      ${feature("📊", "Competitor citation gaps", "See exactly which competitors are being cited instead of you — and why.")}
      ${feature("📡", "Continuous monitoring", "Add your site once and get re-audited on a schedule, with alerts when your score moves.")}
      ${feature("💬", "Sentiment analysis", "Understand how AI engines perceive your brand — positive, neutral, or negative.")}
    </table>

    <div style="text-align:center;margin:32px 0;">
      ${btn("Use them now — they're free →", BASE_URL)}
    </div>

    ${p(`When your free month ends you'll move to the free plan unless you subscribe — Pro keeps all of this going. <a href="${BASE_URL}/upgrade?source=welcome-d7" style="color:${BRAND_COLOR};">See plans →</a>`, "color:#9ca3af;font-size:13px;text-align:center;")}`,
    "Everything is unlocked on your account right now — here's what to try →",
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\nYou're one week into your free core-feature month. Already unlocked on your account:\n- All 4 AI engines (ChatGPT, Claude, Gemini, Perplexity)\n- Fix Generator (JSON-LD, citation-bot robots.txt, optional llms.txt)\n- Competitor citation gap table\n- Continuous monitoring with alerts\n- Sentiment analysis\n\nUse them now: ${BASE_URL}\n\nWhen your free month ends you'll move to the free plan unless you subscribe: ${BASE_URL}/upgrade?source=welcome-d7`;
  return { subject, html, text };
}

// ── Email 4: Weekly Digest (Pro+) ────────────────────────────────────────────
export interface WeeklyDigestData {
  firstName: string;
  latestAudit?: {
    url: string;
    geoScore: number;
    quickWins: string[];
    nextAction?: { title: string; detail: string };
    createdAt: Date;
  };
  auditCount: number;
}

export function weeklyDigestEmail(data: WeeklyDigestData, unsubscribeUrl?: string) {
  const { firstName, latestAudit, auditCount } = data;
  // Pack the headline numbers into the subject — preheader was already
  // doing this work; subject is what actually drives opens.
  const subject = latestAudit
    ? `Your AEO digest: ${auditCount} audit${auditCount !== 1 ? "s" : ""}, latest score ${Math.round(latestAudit.geoScore)}/100`
    : auditCount > 0
      ? `Your AEO digest: ${auditCount} audit${auditCount !== 1 ? "s" : ""} this week`
      : `Your AEO digest — no audits this week, here's how to start`;
  const scoreSection = latestAudit
    ? `${divider()}
      <div style="margin-bottom:16px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Latest Audit Score</div>
      <table cellpadding="0" cellspacing="0" width="100%">
        ${scoreBar("AEO Score", latestAudit.geoScore)}
      </table>
      ${latestAudit.quickWins.length > 0 ? `
        <div style="margin:20px 0 8px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;">Top Quick Wins</div>
        <ul style="margin:0;padding:0 0 0 20px;font-size:14px;line-height:1.8;color:#374151;">
          ${latestAudit.quickWins.slice(0, 3).map(w => `<li>${esc(w)}</li>`).join("")}
        </ul>` : ""}
      ${latestAudit.nextAction ? `
        <div style="margin:20px 0;padding:16px 18px;background:#ecfdf5;border-left:4px solid ${BRAND_COLOR};border-radius:6px;">
          <div style="font-size:12px;font-weight:700;color:${BRAND_COLOR};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:5px;">Your next unfinished action</div>
          <div style="font-size:14px;font-weight:700;color:#1f2937;margin-bottom:4px;">${esc(latestAudit.nextAction.title)}</div>
          <div style="font-size:13px;color:#4b5563;line-height:1.55;">${esc(latestAudit.nextAction.detail)}</div>
        </div>` : ""}
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
  const text = `Hi ${firstName || "there"}, your AEO weekly digest:\n\nAudits this week: ${auditCount}\n${latestAudit ? `Latest AEO score: ${Math.round(latestAudit.geoScore)}\n${latestAudit.nextAction ? `Next unfinished action: ${latestAudit.nextAction.title} — ${latestAudit.nextAction.detail}\n` : `Top quick win: ${latestAudit.quickWins[0] || "none"}\n`}` : ""}\nView your dashboard: ${BASE_URL}`;
  return { subject, html, text };
}

// ── Email: Email Verification (transactional — no unsubscribe) ────────────────
export function verificationEmail(firstName: string, verifyUrl: string) {
  const subject = "Verify your AEO Improvement email address";
  const html = layout(
    `${h1("Confirm your email")}
    ${p(`Hi ${firstName || "there"}, welcome to AEO Improvement! Click the button below to verify your email address and activate your account. Your first month is completely free with all core audit features unlocked.`)}
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

// ── Email: Card Expiring (transactional — billing) ───────────────────────────
export function cardExpiringEmail(firstName: string, last4: string, expMonth: number, expYear: number) {
  const subject = "Your card on file is about to expire";
  const exp = `${String(expMonth).padStart(2, "0")}/${String(expYear).slice(-2)}`;
  const cardLine = last4
    ? `card ending in <strong>${last4}</strong> (expires ${exp})`
    : `card on file (expires ${exp})`;
  const html = layout(
    `${h1("Your card is about to expire")}
    ${p(`Hi ${firstName || "there"}, the ${cardLine} for your AEO Improvement subscription is expiring soon.`)}
    ${p("Update it now so your next renewal goes through without interruption — and you keep access to all 4 AI engines, the Fix Generator, competitor tracking, and your trend history.")}
    <div style="text-align:center;margin:24px 0;">
      ${btn("Update payment method →", `${BASE_URL}/pricing`)}
    </div>
    ${divider()}
    ${p("Already updated it? You can safely ignore this email. Questions about billing? Just reply.", "color:#6b7280;font-size:13px;")}`,
    "Your card on file is expiring — update it to avoid an interruption.",
  );
  const text = `Hi ${firstName || "there"},\n\nThe ${last4 ? `card ending in ${last4}` : "card on file"} for your AEO Improvement subscription expires ${exp}.\n\nUpdate it to keep your subscription active: ${BASE_URL}/pricing\n\nAlready updated? Ignore this email. Questions? Reply.`;
  return { subject, html, text };
}

// ── Email: Renewal Receipt (transactional — billing) ─────────────────────────
export function renewalReceiptEmail(
  firstName: string,
  planName: string,
  amount: string,
  periodEnd?: Date | null,
  invoiceUrl?: string | null,
) {
  const subject = `Your AEO Improvement ${planName} plan renewed`;
  const periodLine = periodEnd
    ? `Your subscription is active through ${periodEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
    : "";
  const html = layout(
    `${h1("Thanks — your subscription renewed")}
    ${p(`Hi ${firstName || "there"}, your AEO Improvement <strong>${planName}</strong> subscription has renewed. You were charged <strong>${amount}</strong>.`)}
    ${periodLine ? p(periodLine) : ""}
    <div style="text-align:center;margin:24px 0;">
      ${btn("Open your dashboard →", `${BASE_URL}/`)}
    </div>
    ${invoiceUrl ? p(`<a href="${invoiceUrl}" style="color:#059669;">View your invoice / receipt →</a>`, "font-size:13px;") : ""}
    ${divider()}
    ${p("Manage your plan or payment method any time from the billing portal. Questions? Just reply to this email.", "color:#6b7280;font-size:13px;")}`,
    `Your AEO Improvement ${planName} plan renewed — ${amount}.`,
  );
  const text = `Hi ${firstName || "there"},\n\nYour AEO Improvement ${planName} subscription renewed. You were charged ${amount}.\n${periodLine ? `\n${periodLine}\n` : ""}${invoiceUrl ? `\nInvoice: ${invoiceUrl}\n` : ""}\nDashboard: ${BASE_URL}/\n\nQuestions? Reply to this email.`;
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
        ${quickWins.slice(0, 5).map(w => `<li>${esc(w)}</li>`).join("")}
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
      <li>Full audit history and score trending</li>
      <li>Priority email support</li>
    </ul>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0;">
      <tr><td style="padding:18px 20px;font-size:14px;color:#065f46;text-align:center;">
        <strong>Pro: $79/mo</strong> · or <strong>$750/yr</strong> (save about 20%)
      </td></tr>
    </table>
    <div style="text-align:center;margin:24px 0;">
      ${btn("Upgrade to Pro →", `${BASE_URL}/upgrade?source=limit-reached-${kind}`)}
    </div>
    ${divider()}
    ${p(`Not ready to upgrade? Your free quota refills automatically on the 1st of next month.`, "color:#6b7280;font-size:13px;")}`,
    `You've used all ${cap} free ${kindLabel}s this month. Upgrade to Pro for ${kind === "audits" ? "100 audits" : "30 simulations"}/mo.`,
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\nYou've used all ${cap} of your free ${kindLabel}s this month. Your quota refills on the 1st.\n\nWant more now? Upgrade to Pro ($79/mo, or $750/yr, saving about 20%) for:\n- ${proBenefit}\n- Sentiment analysis\n- Full audit history\n- Priority support\n\nUpgrade: ${BASE_URL}/upgrade?source=limit-reached-${kind}`;
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
  auditId: string | null | undefined,
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

    ${p("Your audit score measures whether you <em>can</em> be cited. A prompt simulation shows whether you <em>are</em> — here's what to do next:")}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;">
      ${feature("🔬", "Run a prompt simulation", "Type the queries your buyers actually use and see whether ChatGPT, Claude, Gemini, and Perplexity name you, cite your site, or recommend a competitor instead.")}
      ${feature("📊", "Compare to competitors", "Run audits on 2–3 competitors to find your AEO gaps and see who the engines are citing in your place.")}
      ${feature("🛠", "Generate fixes", "Pro users get auto-generated JSON-LD and citation-bot robots.txt entries based on specific gaps — copy and ship.")}
    </table>

    <div style="text-align:center;margin:24px 0;">
      ${btn("Open your audit →", auditId ? `${BASE_URL}/results/${auditId}` : BASE_URL)}
    </div>

    ${divider()}
    ${p("Hit your quota? Pro unlocks 100 audits, 30 prompt simulations, and the Fix Generator. It is $79/mo or $750/yr.", "color:#6b7280;font-size:13px;")}`,
    `Your first audit on ${hostname} scored ${Math.round(geoScore)}/100 — here's what to do next.`,
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\nYou just ran your first AEO audit on ${hostname}. Score: ${Math.round(geoScore)}/100 — ${scoreVerdict}.\n\n${topRecommendation ? `Top opportunity: ${topRecommendation}\n\n` : ""}Next steps:\n- Run a prompt simulation to see how AI engines answer about your brand\n- Audit 2-3 competitors to find your gaps\n- Pro users get auto-generated JSON-LD and citation-bot robots.txt entries\n\nOpen your audit: ${auditId ? `${BASE_URL}/results/${auditId}` : BASE_URL}`;
  return { subject, html, text };
}

// ── Email: Audit Complete (transactional — fires on every non-first audit) ────
// The first-audit email covers the first run with richer onboarding content.
// This email fires for all subsequent audits so the user always gets a
// "your results are ready" link even if they closed the tab mid-run.
export function auditCompleteEmail(
  firstName: string,
  url: string,
  geoScore: number,
  auditId: string | null | undefined,
  unsubscribeUrl?: string,
) {
  const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  const safeHostname = esc(hostname);
  const safeFirstName = esc(firstName) || "there";
  const scoreColor = geoScore >= 75 ? "#10b981" : geoScore >= 50 ? "#f59e0b" : "#ef4444";
  const subject = `Your AEO audit for ${hostname} is ready — ${Math.round(geoScore)}/100`;
  const html = layout(
    `${h1(`Audit complete`)}
    ${p(`Hi ${safeFirstName}, your AEO audit for <strong>${safeHostname}</strong> finished. Here's your score:`)}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background:#f9fafb;border-radius:12px;">
      <tr><td style="padding:24px;text-align:center;">
        <div style="font-size:52px;font-weight:800;color:${scoreColor};line-height:1;">${Math.round(geoScore)}<span style="font-size:24px;color:#9ca3af;">/100</span></div>
        <div style="font-size:13px;color:#6b7280;margin-top:6px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">AEO Score</div>
      </td></tr>
    </table>

    ${p("Open your full results to see the breakdown, top recommendations, and quick wins you can ship today.")}

    <div style="text-align:center;margin:28px 0;">
      ${btn("View full results →", auditId ? `${BASE_URL}/results/${auditId}` : `${BASE_URL}/dashboard`)}
    </div>

    ${divider()}
    <div style="background:#f5f3ff;border-radius:10px;padding:18px 20px;margin:0;">
      <div style="font-size:13px;font-weight:700;color:#5b21b6;margin-bottom:6px;">Next step: run a prompt simulation</div>
      <div style="font-size:13px;color:#374151;line-height:1.6;">Your score tells you whether you <em>can</em> be cited. A simulation tells you whether you <em>are</em> — enter the queries your buyers actually use and see which engines name you, which cite your domain, and which recommend a competitor instead.</div>
      <div style="margin-top:12px;">
        <a href="${BASE_URL}/simulate/${auditId || ""}" style="font-size:13px;font-weight:600;color:#5b21b6;text-decoration:underline;">Run a simulation for this audit →</a>
      </div>
    </div>`,
    `Your AEO audit for ${hostname} scored ${Math.round(geoScore)}/100 — view the full breakdown.`,
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\nYour AEO audit for ${hostname} is ready. Score: ${Math.round(geoScore)}/100.\n\nView full results: ${auditId ? `${BASE_URL}/results/${auditId}` : `${BASE_URL}/dashboard`}\n\nRun a prompt simulation to see how AI engines answer in your category.`;
  return { subject, html, text };
}

// ── Email: Simulation Complete (transactional — fires after every simulation) ─
// Simulations can take 1-3 minutes. This email lets users close the tab and
// come back when the results are in rather than watching a spinner.
export function simulationCompleteEmail(
  firstName: string,
  domain: string,
  visibilityScore: number,
  auditId: number | null | undefined,
  unsubscribeUrl?: string,
) {
  const safeDomain = esc(domain);
  const safeFirstName = esc(firstName) || "there";
  const scoreColor = visibilityScore >= 60 ? "#10b981" : visibilityScore >= 30 ? "#f59e0b" : "#ef4444";
  const subject = `Your AI visibility simulation for ${domain} is done`;
  const simulateUrl = auditId ? `${BASE_URL}/simulate/${auditId}` : `${BASE_URL}/dashboard`;
  const html = layout(
    `${h1(`Simulation complete`)}
    ${p(`Hi ${safeFirstName}, your AI prompt simulation for <strong>${safeDomain}</strong> finished. Here's your visibility score:`)}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background:#f9fafb;border-radius:12px;">
      <tr><td style="padding:24px;text-align:center;">
        <div style="font-size:52px;font-weight:800;color:${scoreColor};line-height:1;">${Math.round(visibilityScore)}<span style="font-size:24px;color:#9ca3af;">/100</span></div>
        <div style="font-size:13px;color:#6b7280;margin-top:6px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">AI Visibility Score</div>
      </td></tr>
    </table>

    ${p("The full breakdown shows mention rates, citation rates, and per-prompt results across each AI engine.")}

    <div style="text-align:center;margin:28px 0;">
      ${btn("View simulation results →", simulateUrl)}
    </div>

    ${divider()}
    ${p("Try adjusting your prompts or adding competitor domains to the Citation Gap table to see how you compare.", "color:#6b7280;font-size:13px;")}`,
    `Your AI visibility simulation for ${domain} scored ${Math.round(visibilityScore)}/100 — see the full breakdown.`,
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\nYour AI prompt simulation for ${domain} is done. Visibility score: ${Math.round(visibilityScore)}/100.\n\nView full results: ${simulateUrl}\n\nThe breakdown includes mention rates, citation rates, and per-prompt results across each engine.`;
  return { subject, html, text };
}

// ── Email: Weekly AEO Insights (free + paid) ─────────────────────────────────
// Sent every Thursday 9 AM UTC to all verified, opted-in users who are past
// the welcome-series window (>= 8 days old). The goal: deliver real strategy
// value to free users so they associate this product with weekly insight,
// not just a tool they used once. Each topic is a self-contained tactic
// they could implement immediately, with a soft contextual pitch tied to
// the topic — never a hard pitch decoupled from the content.
//
// Topics rotate by ISO week-of-year mod 6 so the same user gets a different
// tip every week and only sees a repeat after ~6 weeks.
type InsightTopic = {
  subject: string;
  preheader: string;
  title: string;
  intro: string;
  body: string; // raw HTML, already escaped where needed
  pitch: string; // contextual soft pitch, plain text (no HTML)
  textBody: string; // plain-text version
};

const AEO_INSIGHTS: InsightTopic[] = [
  {
    subject: "The robots.txt mistake quietly blocking AI from your site",
    preheader: "OAI-SearchBot, Claude-SearchBot, PerplexityBot — the bots that decide if you CAN be cited.",
    title: "The robots.txt trap blocking AI from your site",
    intro:
      "Most sites still ship the robots.txt they wrote for the SEO era — which routinely blocks the AI crawlers without anyone realising. And in 2026 the distinction that matters is SEARCH bots vs TRAINING bots: blocking a search bot removes you from that engine's citations; blocking a training bot only opts you out of model training.",
    body: `${p("The citation-critical user-agents — these decide whether you <em>can</em> appear in AI answers:")}
    <ul style="margin:0 0 16px 0;padding:0 0 0 20px;font-size:14px;line-height:1.8;color:#374151;">
      <li><code style="background:#f3f4f6;padding:1px 6px;border-radius:3px;font-size:13px;">OAI-SearchBot</code> + <code style="background:#f3f4f6;padding:1px 6px;border-radius:3px;font-size:13px;">ChatGPT-User</code> — ChatGPT Search index &amp; live fetches (separate from GPTBot!)</li>
      <li><code style="background:#f3f4f6;padding:1px 6px;border-radius:3px;font-size:13px;">Claude-SearchBot</code> + <code style="background:#f3f4f6;padding:1px 6px;border-radius:3px;font-size:13px;">Claude-User</code> — Claude's search index &amp; live fetches</li>
      <li><code style="background:#f3f4f6;padding:1px 6px;border-radius:3px;font-size:13px;">PerplexityBot</code> + <code style="background:#f3f4f6;padding:1px 6px;border-radius:3px;font-size:13px;">Perplexity-User</code> — Perplexity</li>
    </ul>
    ${p("Training-only bots (<code style='background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px;'>GPTBot</code>, <code style='background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px;'>ClaudeBot</code>, <code style='background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px;'>Google-Extended</code>) are a separate decision — block them if you don't want to feed model training; it won't cost you citations. And note: Google AI Overviews use the regular Googlebot, not Google-Extended.")}
    ${p("Drop this near the top of your <code style='background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px;'>/robots.txt</code> to explicitly welcome the search bots:")}
    <pre style="background:#0f172a;color:#e2e8f0;padding:14px 16px;border-radius:8px;font-size:12px;line-height:1.5;overflow-x:auto;margin:0 0 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /</pre>
    ${p("If you have an existing <code style='background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px;'>Disallow: /</code> under <code style='background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px;'>User-agent: *</code>, the per-bot rules above override it for those specific agents — but verify in your audit's Crawler Access section.")}`,
    pitch:
      "Run an audit on your site to see exactly which engines' search bots are currently blocked, and which are getting through.",
    textBody:
      "Most sites still ship the robots.txt they wrote for SEO — which often blocks the AI crawlers.\n\nThe distinction that matters in 2026: SEARCH bots decide whether you can be cited; TRAINING bots only feed model training.\n\nCitation-critical user-agents:\n- OAI-SearchBot + ChatGPT-User (ChatGPT Search — separate from GPTBot!)\n- Claude-SearchBot + Claude-User (Anthropic)\n- PerplexityBot + Perplexity-User\n\nAdd to /robots.txt:\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: Claude-SearchBot\nAllow: /\n\n(repeat for each search bot)\n\nBlocking GPTBot/ClaudeBot/Google-Extended is a separate training opt-out — it won't cost you citations.\n\nRun an audit to see which engines you're currently blocking.",
  },
  {
    subject: "llms.txt is optional — what it can and cannot do",
    preheader: "A cheap extra worth doing right — as long as you know what it can't do.",
    title: "llms.txt is an optional content map, not a citation lever",
    intro:
      "An llms.txt is a plain-markdown summary of your site placed at the root — an executive briefing for AI agents that arrive without context. Honest framing first: crawler-log studies show the major AI search crawlers rarely fetch it today, so treat it as a cheap extra rather than a citation lever. But agents and AI dev tools do read it when pointed at your site, it takes ten minutes, and if you ship one it should be good.",
    body: `${p("Here's a minimal but effective structure to start from:")}
    <pre style="background:#0f172a;color:#e2e8f0;padding:14px 16px;border-radius:8px;font-size:12px;line-height:1.5;overflow-x:auto;margin:0 0 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;"># Acme Robotics

> Industrial robotic arms for high-mix, low-volume manufacturing.

## What we do
We design and manufacture 6-axis robotic arms with payloads from
3kg to 25kg, sold direct to small-batch manufacturers in North
America and the EU.

## Key pages
- [Product specs](https://acme.example/products)
- [Documentation](https://acme.example/docs)
- [Pricing](https://acme.example/pricing)
- [Contact](https://acme.example/contact)

## Optional
- Founded 2018, headquartered in Boston MA
- Press inquiries: press@acme.example</pre>
    ${p("A few things this gets right that many drafts miss:")}
    <ul style="margin:0 0 16px 0;padding:0 0 0 20px;font-size:14px;line-height:1.8;color:#374151;">
      <li>The <strong>blockquote one-liner</strong> directly under the H1 — this is the line a model will quote when summarising you.</li>
      <li>It says <strong>what you sell, to whom, where</strong>. Most llms.txt files describe the product but skip the audience and geography.</li>
      <li>Linked URLs use the <strong>fully-qualified absolute path</strong>, not relative — agents that fetch this file standalone need the absolute reference.</li>
    </ul>`,
    pitch:
      "Finish citation-critical work first. Pro can draft this optional map after your schema, crawler access, and fresh content are in place.",
    textBody:
      "An llms.txt is an optional plain-markdown content map at /llms.txt. Major answer-engine crawlers rarely request it, so it should follow fresh server-visible content, schema, and citation-bot access.\n\nMinimal structure:\n# Brand Name\n> One-line description of what you do.\n\n## What we do\n2-3 sentences: product, audience, geography.\n\n## Key pages\n- Absolute URLs to the most important pages.\n\nPro's Fix Generator can draft the optional map after higher-impact work is complete.",
  },
  {
    subject: "FAQ schema: the highest-ROI structured data for AEO",
    preheader: "AI engines lift Q&A pairs straight into their answers. Here's how.",
    title: "FAQ schema is the highest-ROI structured data for AEO",
    intro:
      "Of all the JSON-LD types you could add, FAQPage routinely earns the most direct lift in AI answers — because the format mirrors exactly how an answer engine wants to consume your content: question, then answer, plain prose, no fluff.",
    body: `${p("Here's a complete example you can adapt — drop it in a <code style='background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px;'>&lt;script type=\"application/ld+json\"&gt;</code> tag in the &lt;head&gt; of any page that already has a Q&amp;A section:")}
    <pre style="background:#0f172a;color:#e2e8f0;padding:14px 16px;border-radius:8px;font-size:12px;line-height:1.5;overflow-x:auto;margin:0 0 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does Acme cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Acme is sold on a monthly subscription, with a discounted annual option. See our pricing page for current rates."
      }
    },
    {
      "@type": "Question",
      "name": "Does Acme integrate with Salesforce?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes — Acme has a native Salesforce integration that syncs contacts, accounts, and opportunities bidirectionally."
      }
    }
  ]
}</pre>
    ${p("Three rules that materially affect lift:")}
    <ul style="margin:0 0 16px 0;padding:0 0 0 20px;font-size:14px;line-height:1.8;color:#374151;">
      <li>The <code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px;">name</code> must be the exact natural-language question someone would ask. Not a slug, not a heading fragment.</li>
      <li>The <code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:13px;">text</code> must be a complete, self-contained answer. Avoid pronouns that reference earlier context ("it", "this") — assume the answer is excerpted in isolation.</li>
      <li>Mirror the same Q&amp;A in visible HTML on the page. Schema without matching visible content is a quality-guideline violation.</li>
    </ul>`,
    pitch:
      "Pro's Fix Generator scans your existing pages for Q&A patterns and emits valid FAQPage JSON-LD ready to paste into your <head>.",
    textBody:
      "FAQPage JSON-LD is the single highest-ROI structured-data add for AEO.\n\nThree rules that matter:\n1. The 'name' must be a natural-language question, not a slug.\n2. The 'text' must be self-contained — no 'it', no 'this' referencing prior context.\n3. Mirror the Q&A in visible HTML — schema without visible content violates guidelines.\n\nPro's Fix Generator emits this for your existing Q&A sections automatically.",
  },
  {
    subject: "Why direct-answer paragraphs beat listicles for AI citations",
    preheader: "The single content-structure change that lifts citation rate.",
    title: "Why direct-answer paragraphs beat listicles for AI citations",
    intro:
      "Practitioners running citation tracking across the four major engines consistently report the same pattern: pages that lead with a complete, prose answer in the first paragraph get cited far more often than pages that bury the answer inside a numbered list.",
    body: `${p("The structural pattern that works:")}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 20px;">
      <tr><td style="padding:8px 0;font-size:14px;color:#374151;">
        <strong>H2:</strong> the question, written exactly as a user would ask it<br/>
        <strong>First paragraph:</strong> a 2–4 sentence complete answer with the key facts<br/>
        <strong>Following paragraphs:</strong> the supporting detail, examples, edge cases<br/>
      </td></tr>
    </table>
    ${p("This is the inverted-pyramid structure newsrooms have used for a century, and it maps almost perfectly onto how an answer engine extracts a citable snippet — the model wants a bounded, complete fragment that stands alone outside the page.")}
    ${p("<strong>Before</strong> (listicle, hard to extract):")}
    <pre style="background:#fff7ed;border-left:3px solid #fb923c;padding:12px 16px;border-radius:0 6px 6px 0;font-size:13px;line-height:1.6;color:#7c2d12;margin:0 0 12px;">## How to set up SSO
1. Go to settings
2. Click integrations
3. Pick your provider
4. Paste the metadata URL
5. Test the login</pre>
    ${p("<strong>After</strong> (direct answer first, list as supporting detail):")}
    <pre style="background:#f0fdf4;border-left:3px solid #10b981;padding:12px 16px;border-radius:0 6px 6px 0;font-size:13px;line-height:1.6;color:#064e3b;margin:0 0 16px;">## How do I set up SSO?

You set up SSO in Acme by going to Settings → Integrations,
selecting your identity provider (Okta, Azure AD, or Google
Workspace), pasting your provider's metadata URL, and running
the test login. It typically takes 5–10 minutes.

The full step-by-step:
1. Navigate to Settings → Integrations
2. ...</pre>`,
    pitch:
      "Run a prompt simulation on a few of your top pages — you'll see immediately whether engines are extracting your answer or skipping past it.",
    textBody:
      "Pages that lead with a complete prose answer get cited more than pages that bury the answer in a list.\n\nThe pattern:\n- H2: the question as a user would ask it\n- First paragraph: 2-4 sentence complete answer\n- Following paragraphs: supporting detail\n\nThis is inverted-pyramid structure — newsrooms have used it for a century. It maps onto how answer engines extract a citable snippet.\n\nRun a prompt simulation on your top pages to see whether engines are extracting your answers or skipping past them.",
  },
  {
    subject: "Brand entity disambiguation — the AEO foundation everyone skips",
    preheader: "If models can't tell who you are, they can't cite you.",
    title: "Brand entity disambiguation: the AEO foundation everyone skips",
    intro:
      "Before an AI engine can cite your site, it has to be confident your brand is a discrete, well-defined entity — distinguishable from companies with similar names, common-noun collisions, and the general noise of the open web. This is the part of AEO most teams skip entirely.",
    body: `${p("The three signals that materially improve entity confidence:")}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 20px;">
      ${feature("①", "A Wikidata Q-item", "Even a stub Q-item with your name, founding date, headquarters, and official website creates a stable identifier the major engines reconcile against. You can create one yourself at wikidata.org — no Wikipedia article required.")}
      ${feature("②", "schema.org/Organization with sameAs", "On your homepage, ship Organization JSON-LD with a sameAs array pointing to your LinkedIn, Crunchbase, GitHub, Wikipedia (if any), and Wikidata Q-item. This explicitly cross-references your identity across the graph.")}
      ${feature("③", "Consistent name across the open web", "Pick exactly one canonical brand name and use it identically — same casing, same spacing, same suffix (Inc., Ltd., or none) — across your homepage title, footer, social bios, and press releases. Name drift is the single biggest cause of failed entity reconciliation.")}
    </table>
    ${p("These three together let an engine answer 'who are they?' with confidence — which is the prerequisite for ever answering 'what do they do?' or 'should I recommend them?' in a citable way.")}`,
    pitch:
      "Your audit's Brand Signals section flags entity-disambiguation gaps the first time around — start there.",
    textBody:
      "Before an AI engine can cite you, it must be confident your brand is a discrete entity. Most teams skip this entirely.\n\nThree signals that improve entity confidence:\n1. A Wikidata Q-item (even a stub) — wikidata.org, no Wikipedia article needed\n2. schema.org/Organization with sameAs[] linking your LinkedIn, Crunchbase, GitHub, Wikidata\n3. One canonical brand name, used identically across homepage, footer, social, press\n\nName drift is the #1 cause of failed entity reconciliation.\n\nYour audit's Brand Signals section flags these gaps.",
  },
  {
    subject: "AI bots have a crawl budget too — make your pages light",
    preheader: "If your hero text only loads after JavaScript, AI engines see an empty page.",
    title: "AI bots have a crawl budget too — make your pages light",
    intro:
      "Most AI crawlers do not execute JavaScript, or execute it only partially and inconsistently. If the substantive content of your page only appears after a client-side render, an AI bot may see a near-empty document — even though the page looks fine in your browser.",
    body: `${p("Two diagnostics worth running today:")}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 20px;">
      ${feature("🔍", "View source vs. inspect element", "Right-click → View Source on your top page. If the body is mostly empty divs, your content is JS-rendered. If you see your headlines and paragraph text right there in the HTML, you're fine.")}
      ${feature("⚡", "Curl the page and grep for content", "<code style='background:#f3f4f6;padding:1px 6px;border-radius:3px;font-size:13px;'>curl -s https://yoursite.com | grep -i 'a key phrase from your hero'</code> — if it returns nothing, AI bots see nothing either.")}
    </table>
    ${p("If your stack is React/Vue/Angular SPA-only, the fix is a server-side render or static pre-render of at least the first viewport's worth of content. Frameworks: Next.js, Nuxt, Astro, Remix, SvelteKit. The bar is low — AI bots are happy with old-fashioned, server-rendered HTML.")}
    ${p("And keep page weight reasonable. Heavy pages with long third-party script chains can be abandoned mid-fetch by crawlers operating under tight time budgets — strip what you can from the critical render path.")}`,
    pitch:
      "Your audit reports both raw-HTML word count and rendered word count — a big gap between the two is the smoking gun for JS-rendering issues.",
    textBody:
      "Most AI crawlers don't execute JavaScript, or do so unreliably. If your content only appears after a client-side render, AI bots may see an empty page.\n\nTwo quick diagnostics:\n1. View Source on your top page — if body is mostly empty divs, content is JS-rendered.\n2. curl -s https://yoursite.com | grep 'a key phrase' — if nothing returns, AI bots see nothing.\n\nFix: SSR or static pre-render at least the first viewport. Use Next.js, Nuxt, Astro, Remix, SvelteKit.\n\nYour audit reports raw-HTML word count vs rendered word count — a big gap is the smoking gun.",
  },
];

export function aeoInsightsEmail(firstName: string, weekIndex: number, unsubscribeUrl?: string) {
  // Pick topic by week-of-year so a user receives a different topic every
  // week and only sees a repeat after the full library cycles. Modulo
  // guards against any negative or out-of-range week index.
  const idx = ((weekIndex % AEO_INSIGHTS.length) + AEO_INSIGHTS.length) % AEO_INSIGHTS.length;
  const topic = AEO_INSIGHTS[idx];
  const safeFirstName = esc(firstName) || "there";
  const html = layout(
    `${h1(topic.title)}
    ${p(`Hi ${safeFirstName},`)}
    ${p(topic.intro)}
    ${topic.body}
    ${divider()}
    <div style="background:#f0fdf4;border:1px solid #a7f3d0;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <div style="font-size:12px;font-weight:600;color:${BRAND_COLOR};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Try it on your site</div>
      <div style="font-size:14px;color:#374151;line-height:1.6;">${esc(topic.pitch)}</div>
    </div>
    <div style="text-align:center;margin:24px 0;">
      ${btn("Open AEO Improvement →", `${BASE_URL}/`)}
    </div>
    ${p("Reply with what you'd like to read about next week — we curate these from real questions.", "color:#6b7280;font-size:13px;")}`,
    topic.preheader,
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\n${topic.title}\n\n${topic.textBody}\n\n— Try it on your site: ${topic.pitch}\n\nOpen AEO Improvement: ${BASE_URL}/\n\nReply with what you'd like to read about next week.`;
  return { subject: topic.subject, html, text };
}

// ── Email: Score Changed (re-audit triggered, ±5 pts) ────────────────────────
// Fires after any audit insert when a prior audit on the same domain exists
// for the same user. The signal: someone re-audited their site, which is
// the strongest engagement moment we get outside of first-audit. Improved
// scores get a celebration; declined scores get a diagnostic frame.
export function scoreChangedEmail(
  firstName: string,
  url: string,
  previousScore: number, // 0-100
  currentScore: number,  // 0-100
  topRecommendation: string | null,
  auditId?: string | null,
  unsubscribeUrl?: string,
) {
  const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  const safeHostname = esc(hostname);
  const safeFirstName = esc(firstName) || "there";
  const safeTopRec = esc(topRecommendation);
  const prev = Math.round(previousScore);
  const curr = Math.round(currentScore);
  const delta = curr - prev;
  const improved = delta > 0;
  const arrow = improved ? "↑" : "↓";
  const accent = improved ? "#10b981" : "#f59e0b"; // celebrate vs amber-warn (not red — we don't want it to feel punitive)

  const subject = improved
    ? `${safeHostname.replace(/&[^;]+;/g, "")} +${delta} AEO points (${prev} to ${curr})`
    : `${safeHostname.replace(/&[^;]+;/g, "")} dropped ${Math.abs(delta)} AEO points: let's find the cause`;
  // (Subject string above will be re-escaped by Postmark; the .replace strips
  // any HTML-escape entities we accidentally introduced via esc() since
  // headers don't decode them.)
  const cleanSubject = improved
    ? `${hostname} +${delta} AEO points (${prev} to ${curr})`
    : `${hostname} dropped ${Math.abs(delta)} AEO points: let's find the cause`;

  const headline = improved ? "Your AEO score went up 🎉" : "Your AEO score dropped";
  const lede = improved
    ? `Nice — your latest audit on <strong>${safeHostname}</strong> came back <strong style="color:${accent};">+${delta} points</strong> higher than the previous one. Whatever you changed, it's working.`
    : `Heads up — your latest audit on <strong>${safeHostname}</strong> came back <strong style="color:${accent};">${delta} points</strong> lower than the previous run. Most score drops trace back to one of three causes (below) and are quick to reverse.`;

  const diagnosticBlock = improved
    ? `${p("To keep the momentum:")}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 16px;">
      ${feature("🔬", "Run a prompt simulation", "Confirm the gain is showing up in actual AI answers — not just the audit score.")}
      ${feature("📈", "Audit again in 2 weeks", "Most improvements take a fresh crawl cycle to fully propagate. The next audit will show the durable change.")}
      ${feature("🎯", "Tackle one more recommendation", "Compounding small wins is how the leaderboards on this score are built.")}
    </table>`
    : `${p("The three most common causes of a score drop:")}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 16px;">
      ${feature("①", "A robots.txt change blocked an AI bot", "Check the Crawler Access section of the new audit — if any of the four engines flipped from green to red, that's it.")}
      ${feature("②", "Schema markup was removed or broke", "JSON-LD that used to validate may have broken on a recent deploy. Check the Schema Types section against the prior audit.")}
      ${feature("③", "Hero / above-fold content changed", "A redesign that moved key content below the fold or into JS-only renders will tank citability score even though the page looks fine.")}
    </table>`;

  const recBlock = safeTopRec
    ? `<div style="margin:20px 0;padding:18px 20px;background:${improved ? "#ecfdf5" : "#fef3c7"};border-left:4px solid ${accent};border-radius:6px;">
        <div style="font-size:12px;font-weight:600;color:${accent};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">${improved ? "Top opportunity to keep going" : "Top fix to recover"}</div>
        <div style="font-size:14px;color:#374151;line-height:1.6;">${safeTopRec}</div>
      </div>`
    : "";

  const html = layout(
    `${h1(headline)}
    ${p(lede)}

    <table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;background:#f9fafb;border-radius:12px;">
      <tr><td style="padding:24px;text-align:center;">
        <div style="display:inline-block;font-size:32px;font-weight:700;color:#9ca3af;line-height:1;">${prev}</div>
        <div style="display:inline-block;font-size:32px;font-weight:700;color:${accent};line-height:1;padding:0 16px;">${arrow}</div>
        <div style="display:inline-block;font-size:48px;font-weight:800;color:${accent};line-height:1;">${curr}<span style="font-size:24px;color:#9ca3af;">/100</span></div>
        <div style="font-size:13px;color:#6b7280;margin-top:8px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">${improved ? `+${delta} points` : `${delta} points`}</div>
      </td></tr>
    </table>

    ${recBlock}
    ${diagnosticBlock}

    <div style="text-align:center;margin:24px 0;">
      ${btn("Open the new audit →", auditId ? `${BASE_URL}/results/${auditId}` : BASE_URL)}
    </div>
    ${divider()}
    ${p(improved
      ? "Pro unlocks 100 audits per month, the Fix Generator for JSON-LD and crawler rules, and full score history so you can see the arc of every improvement."
      : "Pro's Fix Generator can re-draft your schema and crawler rules in minutes if a deploy broke them, and full audit history shows you exactly when the drop started.",
      "color:#6b7280;font-size:13px;")}`,
    improved
      ? `Your score on ${hostname} went from ${prev} to ${curr} — nice work.`
      : `Your score on ${hostname} dropped from ${prev} to ${curr} — three common causes inside.`,
    unsubscribeUrl,
  );
  const text = improved
    ? `Hi ${firstName || "there"},\n\nYour latest audit on ${hostname} came back +${delta} points higher (${prev} to ${curr}). Whatever you changed, it's working.\n\n${topRecommendation ? `Top opportunity to keep going: ${topRecommendation}\n\n` : ""}To keep momentum:\n- Run a prompt simulation to confirm the gain shows in real AI answers\n- Audit again in 2 weeks (improvements take a crawl cycle to propagate)\n- Tackle one more recommendation\n\nOpen the new audit: ${auditId ? `${BASE_URL}/results/${auditId}` : BASE_URL}`
    : `Hi ${firstName || "there"},\n\nYour latest audit on ${hostname} came back ${delta} points lower (${prev} to ${curr}). Most score drops trace to one of three causes:\n\n1. A robots.txt change blocked an AI bot — check Crawler Access\n2. Schema markup was removed or broke on a recent deploy\n3. Hero / above-fold content moved below fold or into JS-only renders\n\n${topRecommendation ? `Top fix to recover: ${topRecommendation}\n\n` : ""}Open the new audit: ${auditId ? `${BASE_URL}/results/${auditId}` : BASE_URL}`;
  return { subject: cleanSubject, html, text };
}

// "Approaching limit" — fires once per kind per month for free users when
// they hit cap-1 (e.g. 4 of 5 audits used). Lower-friction nudge than
// the wall-hit limit-reached email; most upgrades happen at THIS step,
// not at the wall. Single, friendly, one CTA.
export function approachingLimitEmail(
  firstName: string,
  kind: "audits" | "simulations",
  used: number,
  cap: number,
  unsubscribeUrl?: string,
) {
  const safeFirstName = esc(firstName) || "there";
  const remaining = Math.max(0, cap - used);
  const kindLabel = kind === "audits" ? "audits" : "prompt simulations";
  const KindCap = kind === "audits" ? "audits" : "simulations";
  const subject = `${used} of ${cap} free ${KindCap} used — ${remaining} left this month`;
  const preheader = `Heads up — you're one ${kind === "audits" ? "audit" : "simulation"} away from your monthly cap on the free plan.`;

  const proCap = kind === "audits" ? 100 : 30;
  const pitch = kind === "audits"
    ? "Pro gives you 100 audits a month — plus all 4 AI engines, the Fix Generator for JSON-LD and crawler rules, and competitor citation tracking."
    : "Pro gives you 30 prompt simulations a month — across all 4 AI engines instead of just ChatGPT, and 25 prompts per simulation instead of 3.";

  // Visual usage bar — pure HTML/CSS table so it renders in every client.
  const pct = Math.round((used / cap) * 100);
  const bar = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#f3f4f6;border-radius:6px;height:10px;overflow:hidden;">
          <table width="${pct}%" cellpadding="0" cellspacing="0" style="background:linear-gradient(90deg,#10b981,#f59e0b);border-radius:6px;height:10px;">
            <tr><td>&nbsp;</td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding-top:6px;font-size:12px;color:#6b7280;">
          ${used} of ${cap} ${KindCap} used · <strong style="color:#f59e0b;">${remaining} remaining</strong>
        </td>
      </tr>
    </table>`;

  const content = `
    ${h1(`You're approaching your monthly ${kind === "audits" ? "audit" : "simulation"} limit`)}
    ${p(`Hi ${safeFirstName} — quick heads up. You've used ${used} of your ${cap} free ${kindLabel} this month, with ${remaining} left before things pause until next month.`)}
    ${bar}
    ${p(pitch)}
    ${p(`<strong style="color:#111827;">Upgrading takes 30 seconds and you can keep auditing immediately.</strong>`)}
    <div style="text-align:center;margin:8px 0 0;">
      ${btn(`Upgrade to Pro — ${proCap}/mo`, `${BASE_URL}/upgrade?source=approaching-${kind}`)}
    </div>
    ${p(`If you'd rather wait, your quota resets on the 1st. No charge, no action needed.`, "margin-top:24px;font-size:13px;color:#6b7280;text-align:center;")}
  `;

  const html = layout(content, preheader, unsubscribeUrl);
  const text = `Hi ${firstName || "there"},\n\nQuick heads up — you've used ${used} of your ${cap} free ${kindLabel} this month. ${remaining} left before next month's reset.\n\n${pitch}\n\nUpgrade to Pro: ${BASE_URL}/upgrade?source=approaching-${kind}\n\nOr wait — your quota resets on the 1st.`;
  return { subject, html, text };
}

// "What you didn't see" — fires after a free user's audit (NOT their first;
// that's handled by firstAuditEmail). Throttled to once per 7 days. Shows
// what their actual report would look like with all 4 engines + a teaser
// of the Fix Generator output for their hostname. Specific to their data,
// not abstract feature marketing.
export function whatYouMissedEmail(
  firstName: string,
  url: string,
  geoScore: number,
  unsubscribeUrl?: string,
) {
  const safeFirstName = esc(firstName) || "there";
  const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();
  const safeHostname = esc(hostname);
  const subject = `Here's what your ${hostname} audit looks like on Pro`;
  const preheader = `Free shows ChatGPT only. Pro shows all 4 engines and generates technical fixes for ${hostname}.`;

  // Engine row — three locked cards for the engines free users don't get.
  // We deliberately use real product names; users see them everywhere else
  // in the AI search ecosystem so they recognize the value gap.
  const engineCard = (name: string, blurb: string) => `
    <td width="33%" valign="top" style="padding:0 6px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
        <tr><td style="padding:14px;text-align:center;">
          <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:4px;">🔒 ${name}</div>
          <div style="font-size:11px;color:#6b7280;line-height:1.4;">${blurb}</div>
        </td></tr>
      </table>
    </td>`;

  // Fix Generator preview — a tailored Organization schema teaser that uses
  // the user's actual hostname. This is a hand-crafted
  // template fragment that demonstrates what the real generator produces.
  const schemaPreview = `&lt;script type="application/ld+json"&gt;
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[Your verified brand name]",
  "url": "https://${hostname}/",
  "sameAs": []
}
&lt;/script&gt;
<span style="color:#9ca3af;">Related profiles stay empty until you confirm ownership.</span>`;

  const content = `
    ${h1(`Your ${safeHostname} audit, on Pro`)}
    ${p(`Hi ${safeFirstName} — your free audit gave you a GEO score and a recommendation list. Here's what the same audit returns on the Pro plan, against your actual site.`)}

    <div style="margin:24px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;font-weight:600;">
      Engines you didn't see results from
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        ${engineCard("Claude", "Anthropic's reasoning model — used by enterprise teams for AI search.")}
        ${engineCard("Gemini", "Google's AI — directly powers AI Overviews in Google Search.")}
        ${engineCard("Perplexity", "Citation-first AI search; high-intent commercial queries.")}
      </tr>
    </table>
    ${p(`Free runs prompts against ChatGPT only. Pro runs the same prompts against all four — so you actually see whether ${safeHostname} gets cited where your buyers are searching, not just one of four places.`, "font-size:14px;color:#4b5563;")}

    <div style="margin:32px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280;font-weight:600;">
      Your Organization schema (preview)
    </div>
    <pre style="background:#0f172a;color:#e2e8f0;font-family:'SFMono-Regular',Menlo,Monaco,Consolas,monospace;font-size:12px;line-height:1.65;padding:16px 20px;border-radius:8px;overflow-x:auto;margin:0 0 12px;white-space:pre-wrap;">${schemaPreview}</pre>
    ${p(`Pro's Fix Generator drafts FAQPage and Organization JSON-LD plus citation-bot robots.txt additions. An llms.txt content map is included as an explicitly optional extra.`, "font-size:14px;color:#4b5563;")}

    <div style="text-align:center;margin:32px 0 0;">
      ${btn(`Unlock all 4 engines + Fix Generator`, `${BASE_URL}/upgrade?source=what-you-missed`)}
    </div>
    ${p(`No commitment — cancel any time from your dashboard. Annual billing saves on the monthly rate.`, "margin-top:16px;font-size:12px;color:#6b7280;text-align:center;")}
  `;

  const html = layout(content, preheader, unsubscribeUrl);
  const text = `Hi ${firstName || "there"},\n\nYour free audit on ${hostname} gave you a score (${geoScore}/100) and a recommendation list. Here's what the same audit returns on Pro:\n\nEngines you didn't see:\n- Claude (Anthropic)\n- Gemini (Google — powers AI Overviews)\n- Perplexity (citation-first AI search)\n\nFree = ChatGPT only. Pro = all four, side by side.\n\nPlus, Pro's Fix Generator auto-drafts FAQPage and Organization JSON-LD plus citation-bot robots.txt additions. Copy, paste, ship.\n\nUpgrade: ${BASE_URL}/upgrade?source=what-you-missed\n\nNo commitment — cancel any time.`;
  return { subject, html, text };
}

// ── Email: Free-month launch promo announcement (one-time) ───────────────────
// Sent once to every account that existed when the free all-access first
// month shipped (the promo grant gave them a fresh 30-day window). New
// signups never get this — their welcome email covers the same ground.
export function freeMonthPromoEmail(firstName: string, endsAt: Date, unsubscribeUrl?: string) {
  const safeFirstName = esc(firstName) || "there";
  const endDate = endsAt.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const subject = "Your core audit features are free for a full month 🎁";
  const html = layout(
    `${h1("We unlocked everything for you")}
    ${p(`Hi ${safeFirstName}, good news: for the next month, <strong>all core audit features are free on your account</strong>. No credit card and nothing to activate. It's already on.`)}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;">
      ${feature("🔬", "All 4 AI engines", "Run simulations against ChatGPT, Claude, Gemini, and Perplexity — see exactly who cites you where.")}
      ${feature("🔧", "Fix Generator", "Auto-drafts JSON-LD schema and citation-bot robots.txt patches. Copy and ship.")}
      ${feature("📡", "Continuous monitoring", "Add your sites once and get re-audited on a schedule, with alerts when your score moves.")}
      ${feature("📊", "Competitor tracking & sentiment", "The citation gap table and brand sentiment analysis, fully unlocked.")}
      ${feature("📈", "Top-tier limits", "500 audits and 150 simulations this month, with 25 prompts per run.")}
    </table>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0;">
      <tr><td style="padding:18px 20px;font-size:14px;color:#065f46;text-align:center;">
        Free with all core audit features until <strong>${endDate}</strong>
      </td></tr>
    </table>
    <div style="text-align:center;margin:24px 0;">
      ${btn("Start using everything →", BASE_URL)}
    </div>
    ${divider()}
    ${p(`After ${endDate} your account simply returns to your current plan — nothing is charged and your data stays put. We'll remind you a few days before.`, "color:#6b7280;font-size:13px;")}`,
    `All 4 engines, Fix Generator, monitoring, competitor tracking — free on your account until ${endDate}.`,
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\nGood news: for the next month, all core audit features are free on your account. No credit card and nothing to activate.\n\nNow unlocked for you:\n- All 4 AI engines (ChatGPT, Claude, Gemini, Perplexity)\n- Fix Generator (JSON-LD, citation-bot robots.txt, optional llms.txt)\n- Continuous monitoring with alerts\n- Competitor tracking & sentiment analysis\n- 500 audits + 150 simulations this month\n\nConnected GA4 reporting is available on paid plans.\n\nFree until ${endDate}: ${BASE_URL}\n\nAfter that your account simply returns to your current plan and nothing is charged. We'll remind you a few days before.`;
  return { subject, html, text };
}

// ── Email: Free-month ending soon (T-3 days) ─────────────────────────────────
// Sent once by the daily trial-lifecycle scheduler job when a (still-free)
// user's core-feature first month has ≤3 days left. The one moment where the
// upgrade ask is strongest: they've had everything, now it's about to go away.
export function trialEndingSoonEmail(firstName: string, endsAt: Date, unsubscribeUrl?: string) {
  const safeFirstName = esc(firstName) || "there";
  const endDate = endsAt.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const subject = `Your free core-feature month ends ${endDate}`;
  const html = layout(
    `${h1("Your free month is almost up")}
    ${p(`Hi ${safeFirstName}, your free month of AEO Improvement with all core audit features unlocked ends on <strong>${endDate}</strong>.`)}
    ${p("After that, your account moves to the free plan and you'll lose:")}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px;">
      ${feature("🔬", "All 4 AI engines", "Simulations drop back to ChatGPT only — no more Claude, Gemini, or Perplexity results.")}
      ${feature("🔧", "Fix Generator", "No more auto-generated JSON-LD schema or citation-bot robots.txt patches.")}
      ${feature("📡", "Continuous monitoring", "Scheduled re-audits and score alerts stop running for your sites.")}
      ${feature("📊", "Competitor tracking & sentiment", "The citation gap table and brand sentiment analysis lock again.")}
    </table>
    ${p("Keep everything with Pro, or step up to Agency for multi-client work:")}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0;">
      <tr><td style="padding:18px 20px;font-size:14px;color:#065f46;text-align:center;">
        <strong>Pro: $79/mo</strong> · or <strong>$750/yr</strong> (save about 20%)
      </td></tr>
    </table>
    <div style="text-align:center;margin:24px 0;">
      ${btn("Keep my features →", `${BASE_URL}/upgrade?source=trial-ending`)}
    </div>
    ${divider()}
    ${p("Do nothing and you'll land on the free plan — 5 audits and 2 simulations a month, ChatGPT only. Your audit history and account stay safe either way.", "color:#6b7280;font-size:13px;")}`,
    `Your core audit features stay unlocked until ${endDate}. Here's how to keep them after that.`,
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\nYour free core-feature month ends on ${endDate}. After that your account moves to the free plan and you'll lose:\n- All 4 AI engines (back to ChatGPT only)\n- Fix Generator\n- Continuous monitoring & alerts\n- Competitor tracking & sentiment analysis\n\nKeep everything with Pro ($79/mo or $750/yr): ${BASE_URL}/upgrade?source=trial-ending\n\nDo nothing and you'll land on the free plan. Your audit history and account stay safe either way.`;
  return { subject, html, text };
}

// ── Email: Free month ended ──────────────────────────────────────────────────
// Sent once by the daily trial-lifecycle scheduler job right after a
// still-free user's core-feature month lapses. Honest downgrade notice +
// win-back CTA; the guard window in the scheduler keeps this from ever
// firing for long-lapsed legacy accounts.
export function trialEndedEmail(firstName: string, unsubscribeUrl?: string) {
  const safeFirstName = esc(firstName) || "there";
  const subject = "Your free core-feature month has ended";
  const html = layout(
    `${h1("Your free month has ended")}
    ${p(`Hi ${safeFirstName}, your free month with all core audit features unlocked is over, and your account is now on the <strong>free plan</strong>.`)}
    ${p("You still have, free forever:")}
    <ul style="margin:0 0 16px 0;padding:0 0 0 20px;font-size:14px;line-height:1.8;color:#374151;">
      <li>5 AEO audits per month with full recommendations</li>
      <li>2 prompt simulations per month (ChatGPT, 3 prompts)</li>
      <li>Your complete audit history from your free month</li>
    </ul>
    ${p("Everything you had last month — all 4 engines, the Fix Generator, monitoring, competitor tracking, sentiment — is one click away:")}
    <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0;">
      <tr><td style="padding:18px 20px;font-size:14px;color:#065f46;text-align:center;">
        <strong>Pro: $79/mo</strong> · or <strong>$750/yr</strong> (save about 20%) · cancel anytime
      </td></tr>
    </table>
    <div style="text-align:center;margin:24px 0;">
      ${btn("Get everything back →", `${BASE_URL}/upgrade?source=trial-ended`)}
    </div>
    ${divider()}
    ${p("No pressure — the free plan doesn't expire, and your data isn't going anywhere.", "color:#6b7280;font-size:13px;")}`,
    "Your account is now on the free plan — here's what you keep, and how to get everything back.",
    unsubscribeUrl,
  );
  const text = `Hi ${firstName || "there"},\n\nYour free core-feature month has ended and your account is now on the free plan.\n\nYou keep, free forever:\n- 5 audits/month\n- 2 simulations/month (ChatGPT)\n- Your full audit history\n\nGet everything back with Pro ($79/mo or $750/yr): ${BASE_URL}/upgrade?source=trial-ended\n\nNo pressure. The free plan doesn't expire.`;
  return { subject, html, text };
}

export function referralRewardPendingEmail(firstName: string, amountDollars: number, upgradeUrl?: string, unsubscribeUrl?: string) {
  const safeName = esc(firstName || "there");
  const subject = `You earned $${amountDollars} — upgrade to claim your referral credit`;
  const preheader = `Someone you referred just upgraded. Your $${amountDollars} is waiting.`;
  const upgradeLink = upgradeUrl || `${BASE_URL}/pricing`;
  const content = `
    ${h1(`You earned $${amountDollars}`)}
    ${p(`Hi ${safeName} — someone you referred just upgraded to a paid AEO Improvement plan. Your $${amountDollars} referral credit is banked and waiting.`)}
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:24px 28px;margin:24px 0;text-align:center;">
      <div style="font-size:40px;font-weight:800;color:#059669;">$${amountDollars}</div>
      <div style="font-size:14px;color:#065f46;margin-top:4px;">ready to apply to your account</div>
    </div>
    ${p(`When you upgrade to a paid plan, this credit will be applied automatically to your first invoice. No action needed — it just happens.`)}
    <div style="text-align:center;margin:28px 0 0;">
      ${btn("See plans", upgradeLink)}
    </div>
    ${p(`No commitment — cancel any time. Annual billing saves on the monthly rate.`, "margin-top:16px;font-size:12px;color:#6b7280;text-align:center;")}
  `;
  const html = layout(content, preheader, unsubscribeUrl);
  const text = `Hi ${firstName || "there"},\n\nSomeone you referred just upgraded to a paid plan. Your $${amountDollars} referral credit is waiting.\n\nWhen you upgrade, this credit applies automatically to your first invoice.\n\nSee plans: ${upgradeLink}`;
  return { subject, html, text };
}

export function referralRewardEmail(firstName: string, amountDollars: number, unsubscribeUrl?: string) {
  const safeName = esc(firstName || "there");
  const subject = `You earned $${amountDollars} — someone you referred just upgraded`;
  const preheader = `Your $${amountDollars} referral credit has been applied to your account.`;
  const content = `
    ${h1(`You earned $${amountDollars}`)}
    ${p(`Hi ${safeName} — someone you referred just upgraded to a paid AEO Improvement plan. We have applied a $${amountDollars} credit to your account. It will be deducted automatically from your next invoice.`)}
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:24px 28px;margin:24px 0;text-align:center;">
      <div style="font-size:40px;font-weight:800;color:#059669;">$${amountDollars}</div>
      <div style="font-size:14px;color:#065f46;margin-top:4px;">applied to your account</div>
    </div>
    ${p(`Keep sharing your referral link to earn more. There is no cap on how many referral credits you can earn.`)}
    <div style="text-align:center;margin:28px 0 0;">
      ${btn("View your dashboard", `${BASE_URL}/`)}
    </div>
  `;
  const html = layout(content, preheader, unsubscribeUrl);
  const text = `Hi ${firstName || "there"},\n\nSomeone you referred just upgraded to a paid plan. We have applied a $${amountDollars} credit to your account. It will be deducted from your next invoice automatically.\n\nKeep sharing your referral link to earn more.\n\nView your dashboard: ${BASE_URL}/`;
  return { subject, html, text };
}
