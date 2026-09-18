/** One-time September 2026 strategy newsletter. Run from the api-server package. */
import pg from "pg";

export const CAMPAIGN_ID = "seo-geo-strategies-2026-09-17";
const SITE = "https://aeoimprovement.com";
const POSTMARK = "https://api.postmarkapp.com";
const SUBJECT = "3 practical SEO and AI-search fixes for your site";

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function renderNewsletter(firstName, postalAddress, preferencesUrl) {
  if (!postalAddress?.trim()) throw new Error("A valid business postal address is required before sending.");
  const name = firstName?.trim() ? `Hi ${escapeHtml(firstName.trim())},` : "Hello,";
  const primary = `${SITE}/seo-geo-priorities-2026`;
  const service = `${SITE}/improve-service-pages-for-ai-search`;
  const sources = [
    ["Cyrus Shepard, Zyppy Signal: Content Effort", "https://signal.zyppy.com/p/content-effort"],
    ["Cyrus Shepard, Zyppy Signal: Google AI Ranking Factors expert survey", "https://signal.zyppy.com/p/google-ai-ranking-factors"],
    ["Google Search Central: AI features and your website", "https://developers.google.com/search/docs/appearance/ai-features"],
  ];
  const sourceHtml = sources.map(([title, url]) => `<li style="margin:0 0 6px"><a href="${url}" style="color:#047857">${escapeHtml(title)}</a></li>`).join("");
  const sourceText = sources.map(([title, url]) => `${title}: ${url}`).join("\n");
  const step = (number, title, body) => `<tr><td style="padding:0 0 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dbe7e2;border-radius:10px;background:#f8fbf9"><tr><td width="44" valign="top" style="padding:18px 0 18px 18px"><span style="display:inline-block;width:28px;height:28px;border-radius:14px;background:#d1fae5;color:#065f46;text-align:center;line-height:28px;font-size:14px;font-weight:700">${number}</span></td><td style="padding:17px 18px 17px 7px;color:#374151;font-size:14px;line-height:1.55"><strong style="display:block;color:#111827;font-size:16px;margin-bottom:4px">${title}</strong>${body}</td></tr></table></td></tr>`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AEO Improvement</title></head><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1f2937"><span style="display:none;max-height:0;overflow:hidden">Start with one important page, then check a profile you control.</span><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9"><tr><td align="center" style="padding:28px 14px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px"><tr><td style="background:#065f46;border-radius:14px 14px 0 0;padding:26px 32px;color:#fff"><span style="font-size:22px;font-weight:700">✦ AEO Improvement</span><div style="margin-top:6px;font-size:11px;letter-spacing:1.5px;color:#d1fae5">SEO + AI SEARCH GUIDANCE</div></td></tr><tr><td style="height:3px;background:#10b981"></td></tr><tr><td style="background:#fff;padding:34px 32px 30px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0"><p style="margin:0 0 10px;color:#047857;font-size:12px;font-weight:700;letter-spacing:1px">A PRACTICAL FIELD NOTE</p><h1 style="margin:0 0 18px;color:#111827;font-size:26px;line-height:1.25">One page. Three worthwhile checks.</h1><p style="margin:0 0 14px;font-size:15px;line-height:1.65">${name}</p><p style="margin:0 0 22px;font-size:15px;line-height:1.65">AI-search advice gets noisy. Start with a page you want more buyers to find, then work through these checks. You do not need to do all three today.</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${step("1", "Make sure Google can use the page", "Check that the page can be crawled and indexed, points to the right canonical URL, and is eligible for snippets. Fix a blocker before polishing the copy. Google's AI-search features do not require a special AI file or schema.")}${step("2", "Answer the buyer before the filler", `Say who you help, what problem you solve, and when your offer fits. Add a real method, example, test, or first-party observation that you can stand behind. Our <a href="${service}" style="color:#047857">service-page example</a> shows what this looks like.`)}${step("3", "Check the facts beyond your site", "Compare that page with a company profile or relevant listing you control. Correct outdated descriptions so your audience sees the same core facts. Genuine expert contributions can help people discover you; bought links and made-up reviews are not a shortcut.")}</table><p style="margin:8px 0 24px;font-size:14px;line-height:1.6;color:#475569"><strong>Then measure what happened.</strong> Record the edit and check Search Console clicks and queries over time. Treat prompt simulations as samples, not as a count of real AI searches.</p><p style="margin:0 0 20px"><a href="${primary}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:13px 22px;border-radius:8px;font-size:15px;font-weight:700">Use the step-by-step guide →</a></p><p style="margin:0;font-size:14px;line-height:1.6">If you already have an audit, open your <a href="${SITE}/actions" style="color:#047857">Action plan</a> and choose one improvement for that page.</p><hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0 22px"><p style="margin:0 0 10px;color:#334155;font-size:13px;line-height:1.55"><strong>Why these suggestions?</strong> Cyrus Shepard and Zyppy Signal's Content Effort article and recent expert survey informed our content discussion. Google's Search Central guidance supports the technical checks. The survey is expert opinion, not a list of confirmed ranking factors. No edit guarantees rankings or AI citations.</p><ul style="margin:0;padding-left:20px;font-size:12px;line-height:1.5;color:#64748b">${sourceHtml}</ul></td></tr><tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 14px 14px;padding:22px 32px;color:#64748b;font-size:12px;line-height:1.6"><strong style="color:#334155">AEO Improvement</strong><br>${escapeHtml(postalAddress)}<br>This promotional email is for AEO Improvement account holders.<br><a href="${escapeHtml(preferencesUrl)}" style="color:#047857">Manage email preferences</a> &nbsp;·&nbsp; <a href="{{{ pm:unsubscribe }}}" style="color:#047857">Unsubscribe from this newsletter</a></td></tr></table></td></tr></table></body></html>`;
  const text = `One page. Three worthwhile checks.\n\n${firstName?.trim() ? `Hi ${firstName.trim()},` : "Hello,"}\n\nAI-search advice gets noisy. Start with a page you want more buyers to find, then work through these checks. You do not need to do all three today.\n\n1. Make sure Google can use the page. Check crawling, indexing, the canonical URL, and snippet eligibility. Fix a blocker before polishing copy. Google's AI-search features do not require a special AI file or schema.\n\n2. Answer the buyer before the filler. Say who you help, what problem you solve, and when your offer fits. Add a real method, example, test, or first-party observation you can stand behind. Service-page example: ${service}\n\n3. Check the facts beyond your site. Compare your page with a company profile or relevant listing you control. Correct outdated descriptions. Genuine expert contributions can help people discover you; bought links and made-up reviews are not a shortcut.\n\nThen record the edit and check Search Console clicks and queries over time. Prompt simulations are samples, not a count of real AI searches.\n\nStep-by-step guide: ${primary}\nYour Action plan: ${SITE}/actions\n\nWhy these suggestions? Cyrus Shepard and Zyppy Signal's Content Effort article and recent expert survey informed our content discussion. Google's Search Central guidance supports the technical checks. The survey is expert opinion, not confirmed ranking factors. No edit guarantees rankings or AI citations.\n\nSources:\n${sourceText}\n\nAEO Improvement\n${postalAddress}\nThis promotional email is for AEO Improvement account holders.\nManage email preferences: ${preferencesUrl}\nUnsubscribe from this newsletter: {{{ pm:unsubscribe }}}`;
  return { subject: SUBJECT, html, text };
}

async function postmarkRequest(path, token, options = {}) {
  const response = await fetch(`${POSTMARK}${path}`, {
    ...options,
    headers: { Accept: "application/json", "Content-Type": "application/json", "X-Postmark-Server-Token": token, ...options.headers },
  });
  if (!response.ok) throw new Error(`Postmark request failed with HTTP ${response.status}`);
  return response.json();
}

async function broadcastStream(token) {
  const configured = process.env.POSTMARK_BROADCAST_STREAM;
  const data = await postmarkRequest("/message-streams?MessageStreamType=Broadcasts", token);
  const candidates = (data.MessageStreams ?? []).filter((stream) => !stream.ArchivedAt && stream.MessageStreamType === "Broadcasts");
  const stream = configured ? candidates.find((item) => item.ID === configured) : candidates.length === 1 ? candidates[0] : null;
  if (!stream) throw new Error("Choose an active Postmark Broadcast stream with POSTMARK_BROADCAST_STREAM.");
  if (stream.SubscriptionManagementConfiguration?.UnsubscribeHandlingType !== "Postmark") {
    throw new Error("This campaign requires Postmark-managed unsubscribes on the Broadcast stream.");
  }
  return stream.ID;
}

async function checkGuidesLive() {
  for (const path of ["/seo-geo-priorities-2026", "/improve-service-pages-for-ai-search"]) {
    const response = await fetch(`${SITE}${path}`);
    if (!response.ok || !(await response.text()).includes("Sources and credit")) {
      throw new Error(`Guide is not live and verified: ${path}`);
    }
  }
}

export async function runNewsletter(action = "--dry-run", options = {}) {
  if (!["--dry-run", "--check-stream", "--test-to", "--send", "--status"].includes(action)) {
    throw new Error("Usage: node scripts/strategy-newsletter.mjs [--dry-run|--check-stream|--test-to address|--send|--status]");
  }
  if (action === "--check-stream") {
    const token = process.env.POSTMARK_API_TOKEN;
    if (!token) throw new Error("POSTMARK_API_TOKEN is required.");
    const stream = await broadcastStream(token);
    return { campaign: CAMPAIGN_ID, broadcastStreamReady: true, stream };
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  try {
    const eligible = `email_verified = true AND email_opt_out = false AND email IS NOT NULL AND btrim(email) <> '' AND unsubscribe_token IS NOT NULL`;
    if (action === "--dry-run") {
      const result = await pool.query(`SELECT count(*)::int AS total FROM users WHERE ${eligible}`);
      return { campaign: CAMPAIGN_ID, eligible: result.rows[0].total, mode: "dry-run", note: "No messages sent" };
    }
    if (action === "--status") {
      const exists = await pool.query("SELECT to_regclass('public.strategy_campaign_deliveries') IS NOT NULL AS exists");
      if (!exists.rows[0]?.exists) {
        return { campaign: CAMPAIGN_ID, status: [], note: "No campaign delivery claims exist" };
      }
      const result = await pool.query("SELECT status, count(*)::int AS total FROM strategy_campaign_deliveries WHERE campaign_id = $1 GROUP BY status", [CAMPAIGN_ID]);
      return { campaign: CAMPAIGN_ID, status: result.rows };
    }
    const token = process.env.POSTMARK_API_TOKEN;
    const postalAddress = options.postalAddress ?? process.env.CAMPAIGN_POSTAL_ADDRESS;
    if (!token || !postalAddress?.trim()) throw new Error("POSTMARK_API_TOKEN and CAMPAIGN_POSTAL_ADDRESS are required.");
    await checkGuidesLive();
    const stream = await broadcastStream(token);
    const from = process.env.POSTMARK_FROM_EMAIL || "AEO Improvement <info@aeoimprovement.com>";
    const sendOne = async (to, firstName, preferencesUrl) => {
      const message = renderNewsletter(firstName, postalAddress, preferencesUrl);
      const result = await postmarkRequest("/email", token, {
        method: "POST",
        body: JSON.stringify({ From: from, To: to, Subject: message.subject, HtmlBody: message.html, TextBody: message.text, MessageStream: stream, Tag: CAMPAIGN_ID }),
      });
      if (result.ErrorCode !== 0 || !result.MessageID) throw new Error(`Postmark did not accept the message, code ${result.ErrorCode ?? "unknown"}`);
      return result.MessageID;
    };
    await pool.query(`CREATE TABLE IF NOT EXISTS strategy_campaign_deliveries (
      campaign_id text NOT NULL, user_id text NOT NULL, status text NOT NULL,
      reserved_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
      provider_message_id text, PRIMARY KEY (campaign_id, user_id)
    )`);
    const unresolved = await pool.query(
      "SELECT count(*)::int AS total FROM strategy_campaign_deliveries WHERE campaign_id = $1 AND status IN ('sending', 'uncertain')",
      [CAMPAIGN_ID],
    );
    if (unresolved.rows[0].total > 0) throw new Error("A campaign delivery is unresolved; inspect Postmark before continuing.");
    if (action === "--test-to") {
      const to = options.testTo ?? process.argv[3];
      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) throw new Error("Provide one valid test address.");
      const recipient = await pool.query(`SELECT id, email, first_name, unsubscribe_token FROM users WHERE ${eligible} AND lower(email) = lower($1)`, [to]);
      if (recipient.rowCount !== 1) throw new Error("Test address must be one eligible AEO Improvement user.");
      const user = recipient.rows[0];
      const claim = await pool.query(`INSERT INTO strategy_campaign_deliveries (campaign_id, user_id, status)
        VALUES ($1, $2, 'sending') ON CONFLICT DO NOTHING RETURNING user_id`, [CAMPAIGN_ID, user.id]);
      if (!claim.rowCount) throw new Error("This test user already has a campaign delivery record; no duplicate was sent.");
      try {
        const preferencesUrl = `${SITE}/api/auth/unsubscribe?token=${encodeURIComponent(user.unsubscribe_token)}`;
        const messageId = await sendOne(user.email, user.first_name, preferencesUrl);
        await pool.query("UPDATE strategy_campaign_deliveries SET status = 'accepted', provider_message_id = $3, completed_at = now() WHERE campaign_id = $1 AND user_id = $2", [CAMPAIGN_ID, user.id, messageId]);
      } catch {
        await pool.query("UPDATE strategy_campaign_deliveries SET status = 'uncertain', completed_at = now() WHERE campaign_id = $1 AND user_id = $2", [CAMPAIGN_ID, user.id]);
        throw new Error("Test delivery was not confirmed; inspect Postmark before retrying.");
      }
      return { campaign: CAMPAIGN_ID, testAccepted: true, note: "Postmark acceptance is not inbox delivery" };
    }
    const limit = Number.isInteger(options.limit) && options.limit > 0 ? Math.min(options.limit, 5) : null;
    const users = await pool.query(`SELECT id FROM users WHERE ${eligible}
      AND NOT EXISTS (SELECT 1 FROM strategy_campaign_deliveries d WHERE d.campaign_id = $1 AND d.user_id = users.id)
      ORDER BY created_at, id LIMIT $2`, [CAMPAIGN_ID, limit ?? 2147483647]);
    let accepted = 0, skipped = 0, uncertain = 0;
    for (const entry of users.rows) {
      const claim = await pool.query(`INSERT INTO strategy_campaign_deliveries (campaign_id, user_id, status)
        SELECT $1, id, 'sending' FROM users WHERE id = $2 AND ${eligible}
        ON CONFLICT DO NOTHING RETURNING user_id`, [CAMPAIGN_ID, entry.id]);
      if (!claim.rowCount) { skipped++; continue; }
      try {
        const current = await pool.query(`SELECT email, first_name, unsubscribe_token FROM users WHERE id = $1 AND ${eligible}`, [entry.id]);
        if (!current.rowCount) {
          await pool.query("UPDATE strategy_campaign_deliveries SET status = 'ineligible', completed_at = now() WHERE campaign_id = $1 AND user_id = $2", [CAMPAIGN_ID, entry.id]);
          skipped++;
          continue;
        }
        const user = current.rows[0];
        const preferencesUrl = `${SITE}/api/auth/unsubscribe?token=${encodeURIComponent(user.unsubscribe_token)}`;
        const messageId = await sendOne(user.email, user.first_name, preferencesUrl);
        await pool.query("UPDATE strategy_campaign_deliveries SET status = 'accepted', provider_message_id = $3, completed_at = now() WHERE campaign_id = $1 AND user_id = $2", [CAMPAIGN_ID, entry.id, messageId]);
        accepted++;
      } catch {
        // A transport failure after submission is uncertain. Never retry it automatically.
        await pool.query("UPDATE strategy_campaign_deliveries SET status = 'uncertain', completed_at = now() WHERE campaign_id = $1 AND user_id = $2", [CAMPAIGN_ID, entry.id]);
        uncertain++;
        break;
      }
    }
    const remainingResult = await pool.query(`SELECT count(*)::int AS total FROM users WHERE ${eligible}
      AND NOT EXISTS (SELECT 1 FROM strategy_campaign_deliveries d WHERE d.campaign_id = $1 AND d.user_id = users.id)`, [CAMPAIGN_ID]);
    return { campaign: CAMPAIGN_ID, accepted, skipped, uncertain, remaining: remainingResult.rows[0].total,
      note: "Accepted means Postmark accepted the request, not inbox delivery" };
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.endsWith("strategy-newsletter.mjs")) {
  runNewsletter(process.argv[2] ?? "--dry-run").then((result) => console.log(JSON.stringify(result)))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
