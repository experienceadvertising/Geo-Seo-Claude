/** One-time September 2026 strategy newsletter. Run from the api-server package. */
import pg from "pg";

export const CAMPAIGN_ID = "seo-geo-strategies-2026-09-17";
const SITE = "https://aeoimprovement.com";
const POSTMARK = "https://api.postmarkapp.com";
const SUBJECT = "Three useful SEO and AI-search fixes to make this month";

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
  const sourceHtml = sources.map(([title, url]) => `<li><a href="${url}">${escapeHtml(title)}</a></li>`).join("");
  const sourceText = sources.map(([title, url]) => `${title}: ${url}`).join("\n");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#f1f5f9;color:#1f2937;font-family:Arial,sans-serif"><main style="max-width:620px;margin:0 auto;padding:32px 24px;background:#fff;line-height:1.6"><p style="color:#047857;font-weight:bold">AEO Improvement</p><h1 style="font-size:26px;line-height:1.2">Three useful SEO and AI-search fixes</h1><p>${name}</p><p>We have been reviewing recent expert research alongside Google's own documentation. Here are three changes worth checking on a page that matters to your business:</p><ol><li><strong>Make the page findable.</strong> Check crawl access, indexing, canonical URL, and snippet eligibility. Google says its AI Search features do not need a special AI file or schema.</li><li><strong>Answer the buyer's real question early.</strong> Say who the page is for, what you do, and what makes the answer useful. Then show real evidence of your work, such as a method, example, test, or first-party observation. Do not add proof you cannot back up.</li><li><strong>Track the change without overclaiming.</strong> Record what you edited. Use Search Console for actual clicks and queries, controlled rank tracking for selected keywords, and prompt tests as samples rather than real AI-user demand.</li></ol><p><a href="${primary}" style="display:inline-block;padding:12px 18px;background:#047857;color:#fff;text-decoration:none;border-radius:6px">See the step-by-step guide</a></p><p>Working on a service page? Our <a href="${service}">service-page rewrite guide</a> includes a before-and-after example you can adapt honestly.</p><p style="font-size:14px">Credit: Cyrus Shepard and Zyppy Signal informed our Content Effort and expert-survey discussion. Google's Search Central documentation supplies the technical eligibility guidance. The survey reports expert opinions, not confirmed ranking factors. No single edit guarantees a ranking or AI citation.</p><ul style="font-size:14px">${sourceHtml}</ul><hr><p style="font-size:12px;color:#64748b">This is a promotional email from AEO Improvement about SEO and AI-search guidance for account holders.</p><p style="font-size:12px;color:#64748b">AEO Improvement · ${escapeHtml(postalAddress)}</p><p style="font-size:12px"><a href="${escapeHtml(preferencesUrl)}">Stop non-essential AEO Improvement emails</a> · <a href="{{{ pm:unsubscribe }}}">Unsubscribe from this newsletter</a></p></main></body></html>`;
  const text = `Three useful SEO and AI-search fixes\n\n${firstName?.trim() ? `Hi ${firstName.trim()},` : "Hello,"}\n\nWe have been reviewing recent expert research alongside Google's own documentation. Here are three changes worth checking on a page that matters to your business:\n\n1. Make the page findable. Check crawl access, indexing, canonical URL, and snippet eligibility. Google says its AI Search features do not need a special AI file or schema.\n\n2. Answer the buyer's real question early. Say who the page is for, what you do, and show real evidence such as a method, example, test, or first-party observation. Do not add proof you cannot back up.\n\n3. Track the change without overclaiming. Record what you edited. Use Search Console for actual clicks and queries, controlled rank tracking for selected keywords, and prompt tests as samples rather than real AI-user demand.\n\nStep-by-step guide: ${primary}\nService-page rewrite guide: ${service}\n\nCredit: Cyrus Shepard and Zyppy Signal informed our Content Effort and expert-survey discussion. Google's Search Central documentation supplies technical eligibility guidance. The survey reports expert opinions, not confirmed ranking factors. No single edit guarantees a ranking or AI citation.\n\nSources:\n${sourceText}\n\nThis is a promotional email from AEO Improvement about SEO and AI-search guidance for account holders.\nAEO Improvement · ${postalAddress}\nStop non-essential AEO Improvement emails: ${preferencesUrl}\nUnsubscribe from this newsletter: {{{ pm:unsubscribe }}}`;
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

async function run() {
  const action = process.argv[2] ?? "--dry-run";
  if (!["--dry-run", "--check-stream", "--test-to", "--send", "--status"].includes(action)) {
    throw new Error("Usage: node scripts/strategy-newsletter.mjs [--dry-run|--check-stream|--test-to address|--send|--status]");
  }
  if (action === "--check-stream") {
    const token = process.env.POSTMARK_API_TOKEN;
    if (!token) throw new Error("POSTMARK_API_TOKEN is required.");
    const stream = await broadcastStream(token);
    console.log(JSON.stringify({ campaign: CAMPAIGN_ID, broadcastStreamReady: true, stream }));
    return;
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  try {
    const eligible = `email_verified = true AND email_opt_out = false AND email IS NOT NULL AND btrim(email) <> '' AND unsubscribe_token IS NOT NULL`;
    if (action === "--dry-run") {
      const result = await pool.query(`SELECT count(*)::int AS total FROM users WHERE ${eligible}`);
      console.log(JSON.stringify({ campaign: CAMPAIGN_ID, eligible: result.rows[0].total, mode: "dry-run", note: "No messages sent" }));
      return;
    }
    if (action === "--status") {
      const exists = await pool.query("SELECT to_regclass('public.strategy_campaign_deliveries') IS NOT NULL AS exists");
      if (!exists.rows[0]?.exists) {
        console.log(JSON.stringify({ campaign: CAMPAIGN_ID, status: [], note: "No campaign delivery claims exist" }));
        return;
      }
      const result = await pool.query("SELECT status, count(*)::int AS total FROM strategy_campaign_deliveries WHERE campaign_id = $1 GROUP BY status", [CAMPAIGN_ID]);
      console.log(JSON.stringify({ campaign: CAMPAIGN_ID, status: result.rows }));
      return;
    }
    const token = process.env.POSTMARK_API_TOKEN;
    const postalAddress = process.env.CAMPAIGN_POSTAL_ADDRESS;
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
    if (action === "--test-to") {
      const to = process.argv[3];
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
      console.log(JSON.stringify({ campaign: CAMPAIGN_ID, testAccepted: true, note: "Postmark acceptance is not inbox delivery" }));
      return;
    }
    const users = await pool.query(`SELECT id FROM users WHERE ${eligible} ORDER BY created_at, id`);
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
    console.log(JSON.stringify({ campaign: CAMPAIGN_ID, accepted, skipped, uncertain, note: "Accepted means Postmark accepted the request, not inbox delivery" }));
  } finally {
    await pool.end();
  }
}

if (process.argv[1]?.endsWith("strategy-newsletter.mjs")) {
  run().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
