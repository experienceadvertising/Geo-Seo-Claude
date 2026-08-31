import { Router, type IRouter } from "express";
import { eq, desc, and, like, asc } from "drizzle-orm";
import { db, auditsTable, recommendationProgressTable } from "@workspace/db";
import {
  AnalyzeUrlBody,
  ListAuditsQueryParams,
  GetAuditParams,
} from "@workspace/api-zod";
import { analyzeUrl } from "../../lib/geoAnalyzer";
import { generateAuditPdf } from "../../lib/pdfReport";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { RECOMMENDATIONS_SCHEMA_VERSION, METHODOLOGY_VERSION } from "@workspace/recommendations";
import simulateRouter from "./simulate";
import monitorRouter from "./monitor";
import crawlerRouter from "./crawler";
import { requireAuth } from "../../middlewares/auth";
import { analyzeRateLimiter, readRateLimiter } from "../../middlewares/rateLimiters";
import { assertPublicUrl, SsrfError } from "../../lib/safeFetch";
import { getUserPlan, PLAN_LIMITS } from "../../lib/planUtils";
import { consumeQuota, refundQuota, currentYearMonth, markApproachingNotified } from "../../lib/usageLimits";
import { db as appDb, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

/** Escape LIKE metacharacters (%, _, \) so a user-supplied domain/host is
 * matched literally and can't turn into a wildcard scan. Postgres LIKE treats
 * backslash as the default escape character. */
function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Round absurd-precision percentages in scraped page text to 1 decimal place
 * before feeding the excerpt to the LLM. Prevents the model from echoing
 * "1.64735697%" verbatim. Only touches numbers with 3+ decimal places. */
function roundExcerptStats(text: string): string {
  return text.replace(/(\d+)\.(\d{3,})(\s*%)/g, (_m, intPart, _dec, pct) => {
    const n = parseFloat(`${intPart}.${_dec}`);
    return `${n.toFixed(1)}${pct}`;
  });
}

/** Defensive post-process on Claude's executive summary:
 *  - lowercase the hostname anywhere it appears (e.g. "Stripe.com" → "stripe.com")
 *  - round any percentages with 3+ decimal places that slipped through
 *  Note: this does NOT remove invented stats — that's enforced by prompt rules
 *  (the LLM is instructed not to introduce numbers absent from findings). */
function sanitizeInsights(text: string, hostname: string): string {
  let out = text;
  if (hostname) {
    const escaped = hostname.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(escaped, "gi"), hostname.toLowerCase());
  }
  out = out.replace(/(\d+)\.(\d{3,})(\s*%)/g, (_m, i, _d, pct) => `${parseFloat(`${i}.${_d}`).toFixed(1)}${pct}`);
  return out;
}
import { EmailService } from "../../lib/emailService";

const router: IRouter = Router();
router.use(simulateRouter);
router.use(monitorRouter);
router.use(crawlerRouter);

router.get("/geo/public/benchmark", readRateLimiter, async (_req, res): Promise<void> => {
  const result = await db.execute(sql`
    SELECT
      count(*)::int AS sample_size,
      avg(geo_score)::float AS overall,
      avg((scores->>'citability')::float)::float AS citability,
      avg((scores->>'brandAuthority')::float)::float AS brand_authority,
      (avg((scores->>'aiCrawlerAccess')::float) FILTER (WHERE scores ? 'aiCrawlerAccess'))::float AS ai_crawler_access,
      avg((scores->>'technicalSeo')::float)::float AS technical_seo,
      avg((scores->>'structuredData')::float)::float AS structured_data,
      avg((scores->>'platformOptimization')::float)::float AS platform_optimization,
      count(*) FILTER (WHERE geo_score < 40)::int AS needs_work,
      count(*) FILTER (WHERE geo_score >= 40 AND geo_score < 70)::int AS developing,
      count(*) FILTER (WHERE geo_score >= 70)::int AS strong
    FROM audits
  `);
  const row = result.rows[0] as any;
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.json({
    sampleSize: Number(row?.sample_size || 0),
    averages: {
      overall: Number(row?.overall || 0), citability: Number(row?.citability || 0),
      brandAuthority: Number(row?.brand_authority || 0), aiCrawlerAccess: Number(row?.ai_crawler_access || 0),
      technicalSeo: Number(row?.technical_seo || 0), structuredData: Number(row?.structured_data || 0),
      platformOptimization: Number(row?.platform_optimization || 0),
    },
    distribution: [
      { label: "Needs work (0-39)", count: Number(row?.needs_work || 0) },
      { label: "Developing (40-69)", count: Number(row?.developing || 0) },
      { label: "Strong (70-100)", count: Number(row?.strong || 0) },
    ],
  });
});

function normalizeDomain(raw: string): string | null {
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

router.get("/geo/recommendation-progress", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const domain = normalizeDomain(String(req.query.domain || ""));
  if (!domain) { res.status(400).json({ error: "Valid domain required" }); return; }
  const rows = await db.select({
    recommendationId: recommendationProgressTable.recommendationId,
    completedAt: recommendationProgressTable.completedAt,
    implementationNote: recommendationProgressTable.implementationNote,
  }).from(recommendationProgressTable).where(and(
    eq(recommendationProgressTable.userId, req.userId!),
    eq(recommendationProgressTable.domain, domain),
  ));
  res.json({ domain, completed: rows.map((row) => ({ ...row, completedAt: row.completedAt.toISOString() })) });
});

router.post("/geo/recommendation-progress", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const domain = normalizeDomain(String(req.body?.domain || ""));
  const recommendationId = String(req.body?.recommendationId || "").trim();
  const completed = req.body?.completed === true;
  const implementationNote = typeof req.body?.implementationNote === "string"
    ? req.body.implementationNote.trim().slice(0, 1000) || null
    : null;
  if (!domain || !/^[a-z0-9_.:-]{1,120}$/i.test(recommendationId)) {
    res.status(400).json({ error: "Valid domain and recommendation ID required" });
    return;
  }
  if (completed) {
    await db.insert(recommendationProgressTable).values({
      userId: req.userId!, domain, recommendationId,
      implementationNote,
    }).onConflictDoUpdate({
      target: [recommendationProgressTable.userId, recommendationProgressTable.domain, recommendationProgressTable.recommendationId],
      set: { completedAt: new Date(), implementationNote },
    });
  } else {
    await db.delete(recommendationProgressTable).where(and(
      eq(recommendationProgressTable.userId, req.userId!),
      eq(recommendationProgressTable.domain, domain),
      eq(recommendationProgressTable.recommendationId, recommendationId),
    ));
  }
  res.json({ ok: true, completed });
});

router.post("/geo/analyze", requireAuth, analyzeRateLimiter, async (req, res): Promise<void> => {
  const parsed = AnalyzeUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { url } = parsed.data;

  try {
    await assertPublicUrl(url);
  } catch (err) {
    if (err instanceof SsrfError) {
      req.log.warn({ url, reason: err.message, userId: req.userId }, "Blocked URL");
    }
    res.status(400).json({ error: "URL must be a publicly reachable http(s) address." });
    return;
  }

  // Pin the month at request start — prevents UTC-midnight drift where
  // we'd reserve in May but refund/email in June if the request straddles
  // 00:00 UTC on the 1st.
  const ym = currentYearMonth();
  // Atomically RESERVE quota before kicking off any LLM call so we
  // (a) never burn tokens on an over-quota user and (b) two concurrent
  // requests at cap-1 can never both pass. If the audit later fails we
  // refund the reservation so failures on our side don't penalize them.
  const userPlan = await getUserPlan(req.userId!);
  const quota = await consumeQuota(req.userId!, userPlan, "audits", ym);
  if (!quota.allowed) {
    if (quota.firstDenial) {
      // Look up email + unsubscribe token to send the limit-reached upsell.
      // Fire-and-forget — don't block the 429 response on an SMTP round-trip.
      appDb
        .select({
          email: usersTable.email,
          firstName: usersTable.firstName,
          unsubscribeToken: usersTable.unsubscribeToken,
          emailOptOut: usersTable.emailOptOut,
        })
        .from(usersTable)
        .where(sql`id = ${req.userId!}`)
        .then(([u]) => {
          if (u?.email && !u.emailOptOut) {
            const baseUrl = process.env.FRONTEND_URL || "https://aeoimprovement.com";
            const unsubscribeUrl = `${baseUrl}/api/auth/unsubscribe?token=${u.unsubscribeToken}`;
            return EmailService.sendLimitReached(u.email, u.firstName || "", "audits", quota.cap, unsubscribeUrl);
          }
          return undefined;
        })
        .catch((err) => req.log.error({ err, userId: req.userId }, "limit-reached email failed"));
    }
    res.status(429).json({
      error: `You've used all ${quota.cap} ${userPlan === "free" ? "free " : ""}audits this month. ${userPlan === "free" ? "Upgrade to Pro for 100 audits/mo." : "Your quota refills next month."}`,
      upgradeRequired: userPlan === "free",
      limitType: "audits",
      used: quota.used,
      cap: quota.cap,
    });
    return;
  }

  // Approaching-limit nudge: free user just consumed the second-to-last
  // slot in their monthly cap. Fire ONCE per (user, kind, month) via the
  // atomic markApproachingNotified flag-claim. Skipped for tiny caps
  // (< 4) where "you have 1 left" lands too close to first use to feel
  // useful — those users get the existing limit-reached email instead.
  // Fire-and-forget — never block the analyze on email plumbing.
  if (userPlan === "free" && quota.cap >= 4 && quota.used + 1 === quota.cap - 1) {
    (async () => {
      try {
        const claimed = await markApproachingNotified(req.userId!, "audits", ym);
        if (!claimed) return;
        const [u] = await appDb
          .select({
            email: usersTable.email,
            firstName: usersTable.firstName,
            unsubscribeToken: usersTable.unsubscribeToken,
            emailOptOut: usersTable.emailOptOut,
          })
          .from(usersTable)
          .where(eq(usersTable.id, req.userId!));
        if (!u?.email || u.emailOptOut) return;
        const baseUrl = process.env.FRONTEND_URL || "https://aeoimprovement.com";
        const unsubscribeUrl = `${baseUrl}/api/auth/unsubscribe?token=${u.unsubscribeToken}`;
        await EmailService.sendApproachingLimit(
          u.email, u.firstName || "", "audits", quota.used + 1, quota.cap, unsubscribeUrl,
        );
      } catch (err) {
        req.log.error({ err, userId: req.userId }, "approaching-limit email failed");
      }
    })();
  }

  req.log.info({ url, userId: req.userId }, "Starting GEO analysis");

  try {
    const analyzeStart = Date.now();
    const analysis = await analyzeUrl(url);
    const analyzeMs = Date.now() - analyzeStart;

    const insightsStart = Date.now();
    let aiInsights: string | null = null;
    try {
      const brand = analysis.brandName || (() => {
        try { return new URL(url).hostname.replace(/^www\./, "").split(".")[0]; } catch { return "this site"; }
      })();
      const hostname = (() => { try { return new URL(url).hostname; } catch { return url; } })();

      const topRecs = analysis.recommendations
        .filter((r) => r.priority === "critical" || r.priority === "high")
        .slice(0, 6)
        .map((r, i) => `${i + 1}. [${r.priority.toUpperCase()}] ${r.title} — ${r.detail}`)
        .join("\n");

      const headingsList = (analysis.topHeadings ?? []).slice(0, 8).map((h) => `  • ${h}`).join("\n") || "  (no headings detected)";

      const brandAuthLines = analysis.brandSignals
        .map((s) => `  • ${s.source}: ${s.found ? `FOUND${s.detail ? ` (${s.detail})` : ""}` : "not found"}`)
        .join("\n");

      const presentSchemas = analysis.schemaTypes.filter((s) => s.present).map((s) => s.type);
      const missingImportantSchemas = ["Organization", "Article", "FAQPage", "BreadcrumbList", "Product"]
        .filter((t) => !presentSchemas.includes(t));

      const blockedCrawlers = analysis.crawlers.filter((c) => !c.allowed).map((c) => c.name);

      const wins: string[] = [];
      if (analysis.scores.citability >= 70) wins.push(`citability score is strong (${analysis.scores.citability}/100)`);
      if (analysis.scores.technicalSeo >= 80) wins.push("technical SEO foundation is solid");
      if (analysis.scores.structuredData >= 70) wins.push("structured data is in good shape");
      if (analysis.scores.brandAuthority >= 70) wins.push(`${brand} already has measurable brand authority signals`);
      if (analysis.crawlers.every((c) => c.allowed)) wins.push("all major AI crawlers are allowed");
      if (!analysis.requiresJavaScript) wins.push("content is server-rendered (AI crawlers can read it)");

      const prompt = `You are a senior Generative Engine Optimization (GEO) consultant writing a personalized briefing for ${brand} on the page at ${url}.

Your job: write 4-5 highly specific, actionable recommendations that reference ${brand} by name and reference the actual content, headings, or signals below. Avoid generic platitudes — every recommendation must be something the ${brand} team could implement on THIS page this week.

=== PAGE CONTEXT ===
Brand / company: ${brand}
URL: ${url}
Domain: ${hostname}
Page title: ${analysis.title || "(no title)"}
Meta description: ${analysis.description || "(no description)"}
Word count (rendered): ${analysis.wordCount} | Word count (raw HTML, what crawlers see): ${analysis.rawHtmlWordCount}${analysis.requiresJavaScript ? " — ⚠ JS-DEPENDENT, crawlers see almost nothing" : ""}

Top headings on the page:
${headingsList}

First ~1500 chars of visible content:
"""
${roundExcerptStats(analysis.pageExcerpt || "(no content extracted)")}
"""

=== AI VISIBILITY SIGNALS ===
Overall GEO score: ${analysis.geoScore}/100
Citability ${analysis.scores.citability}/100 · Brand Authority ${analysis.scores.brandAuthority}/100 · AI Crawler Access ${analysis.scores.aiCrawlerAccess}/100 · Technical SEO ${analysis.scores.technicalSeo}/100 · Structured Data ${analysis.scores.structuredData}/100 · Platform Optimization ${analysis.scores.platformOptimization}/100

Brand authority footprint for "${brand}":
${brandAuthLines || "  (no signals checked)"}

Schema present: ${presentSchemas.join(", ") || "none"}
Schema missing (high-impact): ${missingImportantSchemas.join(", ") || "none"}
Blocked AI crawlers: ${blockedCrawlers.join(", ") || "none"}
Has llms.txt: ${analysis.hasLlmsTxt} · HTTPS: ${analysis.hasHttps} · Canonical: ${analysis.hasCanonical}

What's already working: ${wins.join("; ") || "limited bright spots — focus on fundamentals"}

=== TOP RULE-BASED FINDINGS (don't just repeat — build on these with company-specific advice) ===
${topRecs || "(no critical/high findings — focus on advanced GEO tactics)"}

=== INSTRUCTIONS ===
Write a briefing in this exact markdown structure:

**Executive summary**
2-3 sentences naming ${brand} explicitly, stating the single biggest opportunity for this specific page given what it appears to be about (infer from title, headings, content excerpt).

**Top recommendations**
4-5 numbered recommendations. Each must:
- Start with a bold one-line action ("**1. Add a comparison table of ${brand} vs. [likely competitors]**")
- Reference something concrete from the page (a heading you saw, the topic, the brand, the missing schema, the JS-rendering issue, etc.)
- Give 1-2 sentences of "how to do it on this page" — no generic theory
- End with the expected impact in plain language

**Quick wins this week**
3 bullets — fastest things ${brand} can ship in <1 day each.

**Brand facts check**
For a homepage, About page, product page, or service page, assess whether the visible copy makes these facts unmistakable: who ${brand} is, what it is, who it helps, the problem it solves, and its specialty or differentiator. If any are unclear, give one concrete rewrite in this form: "${brand} is a [category] for [customer], helping them [solve problem] through [differentiator]." Do not force this recommendation on an article or other non-company page.

Hard rules:
- Mention "${brand}" by name in at least 3 places
- Reference at least 2 specific headings or phrases from the actual page content above
- No filler ("In today's AI landscape..." etc.) — every sentence has a fact or instruction
- Total length 350-500 words
- NEVER recommend something that is already confirmed satisfied above (e.g. if Has llms.txt: true, do NOT suggest creating llms.txt; if no blocked crawlers, do NOT suggest unblocking them; if HTTPS is true, do NOT mention HTTPS)
- Treat the audit as a diagnostic estimate, not proof of live citations. Do not say an engine will, always, or must cite content, and do not claim that any engine requires a specific content format. Use calibrated language such as "can", "may", or "is worth testing".
- Only recommend FAQPage, BreadcrumbList, Article, or HowTo schema when the page already has the matching visible content and page type. Never present any of those schema types as a universal homepage fix.
- DO NOT invent quantitative claims. You may NOT write percentages, multipliers ("4x"), or ranking-position numbers UNLESS that exact figure literally appears in the "TOP RULE-BASED FINDINGS" section above. No "extracted N% more often", no "Nx more reliably", no "deprioritize by N positions" — these are forbidden unless quoted verbatim from the findings.
- When quoting any statistic that appears in the page content excerpt (e.g. "1.64735697% of GDP"), round to the precision a human would write: 1 decimal place for percentages and ratios, 2 decimal places only when the number is between 0 and 1. Never reproduce more than 4 significant figures from page-derived stats.
- The ONLY number you may call "the score", "your score", or "the AEO/GEO score" is the Overall GEO score (${analysis.geoScore}/100). The six category figures (Citability, Brand Authority, AI Crawler Access, Technical SEO, Structured Data, Platform Optimization) are SUB-SCORES — if you cite one, name it explicitly (e.g. "your Citability sub-score of ${analysis.scores.citability}/100"). Never present a sub-score as the page's overall score.
- When you reference the page URL or domain, write the hostname in lowercase (e.g. "stripe.com", not "Stripe.com"), even if the page title or excerpt capitalizes it.`;

      // Latency-critical: this call blocks the audit response while the user
      // watches the "Generating insights" spinner. The briefing is a short,
      // strictly-templated ~400-word markdown doc, so the fast/cheap tier
      // handles it well — INSIGHTS_MODEL overrides without a redeploy if you
      // want heavier prose back (e.g. INSIGHTS_MODEL=claude-sonnet-4-5).
      // Leave enough headroom for the model to finish the requested structure.
      // stops a runaway generation from stalling the response.
      const message = await anthropic.messages.create({
        model: process.env.INSIGHTS_MODEL || "claude-haiku-4-5",
        max_tokens: 1800,
        messages: [{ role: "user", content: prompt }],
      });

      const block = message.content[0];
      if (block.type === "text" && message.stop_reason !== "max_tokens") {
        aiInsights = sanitizeInsights(block.text, hostname);
      }
    } catch (aiErr) {
      req.log.warn({ err: aiErr }, "AI insights generation failed, proceeding without");
    }
    // Phase timings — when a user reports "the audit is slow", this log line
    // says whether the crawl/render or the LLM call is to blame.
    req.log.info(
      { url, analyzeMs, insightsMs: Date.now() - insightsStart },
      "GEO analysis phases complete",
    );

    const [audit] = await db.insert(auditsTable).values({
      userId: req.userId!,
      url: analysis.url,
      title: analysis.title,
      description: analysis.description,
      geoScore: analysis.geoScore,
      scores: analysis.scores,
      crawlers: analysis.crawlers,
      citabilityBlocks: analysis.citabilityBlocks,
      avgCitabilityScore: analysis.avgCitabilityScore,
      schemaTypes: analysis.schemaTypes,
      platforms: analysis.platforms,
      quickWins: analysis.quickWins,
      technicalIssues: analysis.technicalIssues,
      hasLlmsTxt: analysis.hasLlmsTxt,
      hasHttps: analysis.hasHttps,
      hasCanonical: analysis.hasCanonical,
      hasNoSnippet: analysis.hasNoSnippet,
      wordCount: analysis.wordCount,
      rawHtmlWordCount: analysis.rawHtmlWordCount,
      renderedWordCount: analysis.renderedWordCount,
      requiresJavaScript: analysis.requiresJavaScript,
      renderedSuccessfully: analysis.renderedSuccessfully,
      aiInsights,
      brandName: analysis.brandName,
      brandSignals: analysis.brandSignals,
      recommendations: analysis.recommendations,
    }).returning();

    // Quota was already reserved up-front by consumeQuota — nothing to do
    // here on the success path. Reservation is only refunded if we throw
    // before this point (see catch block).

    // First-audit milestone email — atomically set firstAuditAt only if
    // it's still null. The UPDATE returning row count tells us whether
    // this is genuinely the user's first audit (preventing duplicates if
    // two audits race to completion).
    const isFirstAuditPromise = appDb
      .execute(sql`UPDATE users SET first_audit_at = NOW() WHERE id = ${req.userId!} AND first_audit_at IS NULL RETURNING email, first_name AS "firstName", unsubscribe_token AS "unsubscribeToken", email_opt_out AS "emailOptOut"`)
      .then((result) => {
        const u = result.rows[0] as any;
        if (!u || !u.email || u.emailOptOut) return false;
        const topRec = (analysis.recommendations ?? [])
          .filter((r: any) => r.priority === "critical" || r.priority === "high")[0];
        const topRecommendationText = topRec ? `${topRec.title}: ${topRec.detail}` : null;
        const baseUrl = process.env.FRONTEND_URL || "https://aeoimprovement.com";
        const unsubscribeUrl = `${baseUrl}/api/auth/unsubscribe?token=${u.unsubscribeToken}`;
        EmailService.sendFirstAudit(u.email, u.firstName || "", url, analysis.geoScore, String(audit.id), topRecommendationText, unsubscribeUrl)
          .catch((err) => req.log.error({ err, userId: req.userId }, "first-audit email failed"));
        return true; // genuinely first audit — skip score-changed
      })
      .catch((err) => {
        req.log.error({ err, userId: req.userId }, "first-audit milestone update failed");
        return false;
      });

    // Score-Changed milestone email — fires when a user re-audits the same
    // domain and the score moves by >= 5 points. We compare against the
    // most recent prior audit on the same hostname (excluding the one we
    // just inserted). Skip if this was the user's very first audit (no
    // prior history) or if the prior audit happened in the last 6 hours
    // (treat near-simultaneous re-runs as iteration noise, not signal).
    isFirstAuditPromise.then(async (wasFirst) => {
      if (wasFirst) return;
      try {
        const hostname = (() => { try { return new URL(url).hostname.toLowerCase(); } catch { return null; } })();
        if (!hostname) return;
        // Find recent audits on this hostname for this user, excluding the
        // one we just inserted. LIKE pre-filters via the index; the parsed-
        // hostname check below is what makes the match exact (otherwise
        // `LIKE %stripe.com%` would also match `not-stripe.com`).
        const recent = await appDb
          .select({ url: auditsTable.url, geoScore: auditsTable.geoScore, createdAt: auditsTable.createdAt })
          .from(auditsTable)
          .where(and(
            eq(auditsTable.userId, req.userId!),
            like(auditsTable.url, `%${escapeLike(hostname)}%`),
          ))
          .orderBy(desc(auditsTable.createdAt))
          .limit(10);
        const matches = recent.filter((r) => {
          try {
            const h = new URL(r.url).hostname.toLowerCase();
            return h === hostname || h.endsWith(`.${hostname}`);
          } catch { return false; }
        });
        // matches[0] is the just-inserted one; matches[1] is the actual prior.
        const prior = matches[1];
        if (!prior) return;
        const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
        if (prior.createdAt > sixHoursAgo) return; // iteration noise

        // Both sides are stored on the same 0-100 scale: the analyzer emits
        // a Math.round'd weighted score in [0,100] and the audits.geo_score
        // column is `real` storing that value verbatim. No scale conversion
        // needed — pass raw to the email template.
        const prev = prior.geoScore;
        const curr = analysis.geoScore;
        const delta = Math.round(curr) - Math.round(prev);
        if (Math.abs(delta) < 5) return;

        // Look up the user for email + unsubscribe token. Skip if opted out.
        const [u] = await appDb
          .select({
            email: usersTable.email,
            firstName: usersTable.firstName,
            unsubscribeToken: usersTable.unsubscribeToken,
            emailOptOut: usersTable.emailOptOut,
          })
          .from(usersTable)
          .where(eq(usersTable.id, req.userId!));
        if (!u || !u.email || u.emailOptOut) return;

        const topRec = (analysis.recommendations ?? [])
          .filter((r: any) => r.priority === "critical" || r.priority === "high")[0];
        const topRecommendationText = topRec ? `${topRec.title}: ${topRec.detail}` : null;
        const baseUrl = process.env.FRONTEND_URL || "https://aeoimprovement.com";
        const unsubscribeUrl = `${baseUrl}/api/auth/unsubscribe?token=${u.unsubscribeToken}`;
        await EmailService.sendScoreChanged(
          u.email, u.firstName || "", url, prev, curr, topRecommendationText, String(audit.id), unsubscribeUrl,
        );
      } catch (err) {
        req.log.error({ err, userId: req.userId }, "score-changed email failed");
      }
    });

    // Audit-complete notification — fires on every non-first audit so the
    // user always gets a direct link back to their results even if they
    // closed the tab while the run was in progress. First audits already
    // get the richer firstAuditEmail above, so we skip them here.
    isFirstAuditPromise.then(async (wasFirst) => {
      if (wasFirst) return;
      try {
        const [u] = await appDb
          .select({
            email: usersTable.email,
            firstName: usersTable.firstName,
            unsubscribeToken: usersTable.unsubscribeToken,
            emailOptOut: usersTable.emailOptOut,
          })
          .from(usersTable)
          .where(eq(usersTable.id, req.userId!));
        if (!u?.email || u.emailOptOut) return;
        const baseUrl = process.env.FRONTEND_URL || "https://aeoimprovement.com";
        const unsubscribeUrl = `${baseUrl}/api/auth/unsubscribe?token=${u.unsubscribeToken}`;
        await EmailService.sendAuditComplete(
          u.email, u.firstName || "", url, analysis.geoScore, String(audit.id), unsubscribeUrl,
        );
      } catch (err) {
        req.log.error({ err, userId: req.userId }, "audit-complete email failed");
      }
    });

    // "What you didn't see" upsell — fires for free users on every audit
    // EXCEPT their first (firstAuditEmail handles that with a different,
    // celebratory framing). Throttled to once per 7 days per user via
    // users.what_you_missed_sent_at so power-user free accounts aren't
    // spammed. Chains off isFirstAuditPromise so we don't query firstAuditAt
    // twice — the resolved value already tells us whether this was first.
    isFirstAuditPromise.then(async (wasFirst) => {
      if (wasFirst) return;
      if (userPlan !== "free") return;
      try {
        const [u] = await appDb
          .select({
            email: usersTable.email,
            firstName: usersTable.firstName,
            unsubscribeToken: usersTable.unsubscribeToken,
            emailOptOut: usersTable.emailOptOut,
            whatYouMissedSentAt: usersTable.whatYouMissedSentAt,
          })
          .from(usersTable)
          .where(eq(usersTable.id, req.userId!));
        if (!u?.email || u.emailOptOut) return;
        const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);
        if (u.whatYouMissedSentAt && u.whatYouMissedSentAt > sevenDaysAgo) return;
        // Atomic gate on the throttle timestamp — UPDATE only if still null
        // OR older than 7 days. Prevents two concurrent audits both passing
        // the read-side check and double-sending.
        const claim = await appDb.execute(sql`
          UPDATE users
          SET what_you_missed_sent_at = NOW()
          WHERE id = ${req.userId!}
            AND (what_you_missed_sent_at IS NULL OR what_you_missed_sent_at < ${sevenDaysAgo})
          RETURNING 1
        `);
        if (claim.rows.length === 0) return;
        const baseUrl = process.env.FRONTEND_URL || "https://aeoimprovement.com";
        const unsubscribeUrl = `${baseUrl}/api/auth/unsubscribe?token=${u.unsubscribeToken}`;
        await EmailService.sendWhatYouMissed(
          u.email, u.firstName || "", url, analysis.geoScore, unsubscribeUrl,
        );
      } catch (err) {
        req.log.error({ err, userId: req.userId }, "what-you-missed email failed");
      }
    });

    res.json({
      ...analysis,
      id: audit.id,
      createdAt: audit.createdAt.toISOString(),
      aiInsights,
      recommendationsSchemaVersion: RECOMMENDATIONS_SCHEMA_VERSION,
      methodologyVersion: METHODOLOGY_VERSION,
    });
  } catch (err) {
    req.log.error({ err }, "GEO analysis failed");
    // Refund the reservation we made up-front — best-effort, don't leak
    // the original error if refund itself fails.
    refundQuota(req.userId!, "audits", ym).catch((refundErr) =>
      req.log.error({ err: refundErr, userId: req.userId, ym }, "Failed to refund audit quota"),
    );
    res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

router.get("/geo/audits", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const parsed = ListAuditsQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 20) : 20;

  const audits = await db.select({
    id: auditsTable.id,
    url: auditsTable.url,
    geoScore: auditsTable.geoScore,
    createdAt: auditsTable.createdAt,
  }).from(auditsTable)
    .where(eq(auditsTable.userId, req.userId!))
    .orderBy(desc(auditsTable.createdAt))
    .limit(limit);

  res.json(audits.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  })));
});

router.get("/geo/audits/:id", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAuditParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [audit] = await db.select().from(auditsTable).where(
    and(eq(auditsTable.id, params.data.id), eq(auditsTable.userId, req.userId!))
  );
  if (!audit) {
    res.status(404).json({ error: "Audit not found" });
    return;
  }

  // Detect whether this stored audit was generated under the v1 catalog
  // (recommendations carry a `source` field). Legacy audits predate the
  // catalog and render without source badges on the client.
  //
  // We scan ALL recommendations rather than just index 0 because a v1 audit
  // that, by signal coincidence, fired only one rec (or recs were trimmed by
  // some downstream process) should still be detected correctly. An empty
  // recommendations array remains null — there is nothing for the client to
  // badge in that case anyway, so the schema version is not actionable.
  const storedRecs = (audit.recommendations as unknown[]) ?? [];
  // v1 detection: a stored rec carries a non-null `source` object. We use
  // `!= null` (not `"source" in r`) so a placeholder rec persisted with
  // `source: null` does NOT false-positive as v1 — that would mismatch the
  // PDF exporter (which uses the same `r.source != null` check) and produce
  // a v1 audit on the web with a legacy notice in the PDF.
  const hasV1Source = storedRecs.some(
    (r) =>
      typeof r === "object" &&
      r !== null &&
      (r as Record<string, unknown>).source != null,
  );

  res.json({
    ...audit,
    createdAt: audit.createdAt.toISOString(),
    recommendationsSchemaVersion: hasV1Source ? RECOMMENDATIONS_SCHEMA_VERSION : null,
    methodologyVersion: METHODOLOGY_VERSION,
  });
});

router.get("/geo/audits/:id/pdf", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAuditParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [audit] = await db.select().from(auditsTable).where(
    and(eq(auditsTable.id, params.data.id), eq(auditsTable.userId, req.userId!))
  );
  if (!audit) {
    res.status(404).json({ error: "Audit not found" });
    return;
  }

  const safeHost = (() => {
    try { return new URL(audit.url).hostname.replace(/[^a-z0-9.-]/gi, "_"); } catch { return "audit"; }
  })();

  try {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="geo-audit-${safeHost}-${audit.id}.pdf"`);
    res.on("error", (err) => req.log.error({ err, auditId: audit.id }, "PDF response stream error"));
    await generateAuditPdf(audit, res);
  } catch (err) {
    req.log.error({ err, auditId: audit.id }, "PDF generation failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF" });
    } else {
      res.destroy();
    }
  }
});

// ─── Visibility History ──────────────────────────────────────────────────────
router.get("/geo/audits/history", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const domain = typeof req.query.domain === "string" ? req.query.domain.trim().toLowerCase() : "";
  if (!domain) {
    res.status(400).json({ error: "domain query param required" });
    return;
  }
  const plan = await getUserPlan(req.userId!);
  // Free: last 30 days; Pro: last year; Agency: 2 years
  const daysCap = plan === "agency" ? 730 : plan === "pro" ? 365 : 30;
  const since = new Date(Date.now() - daysCap * 24 * 60 * 60 * 1000);

  // Pre-filter with LIKE (uses the index) but be deliberately a touch loose
  // so we don't miss audits where the URL has a subdomain or a trailing
  // path. The exact hostname check below is what guarantees correctness.
  const audits = await db
    .select({
      id: auditsTable.id,
      url: auditsTable.url,
      geoScore: auditsTable.geoScore,
      createdAt: auditsTable.createdAt,
    })
    .from(auditsTable)
    .where(
      and(
        eq(auditsTable.userId, req.userId!),
        like(auditsTable.url, `%${escapeLike(domain)}%`),
      )
    )
    .orderBy(asc(auditsTable.createdAt))
    .limit(200);

  // Exact-host filter — `LIKE %stripe.com%` would otherwise match
  // `not-stripe.com` and `stripe.com.evil.tld`. Compare against the parsed
  // hostname (lowercased) and accept either an exact hit or a subdomain
  // suffix match (audits.stripe.com → stripe.com).
  const filtered = audits.filter((a) => {
    if (a.createdAt < since) return false;
    let host: string;
    try { host = new URL(a.url).hostname.toLowerCase(); } catch { return false; }
    return host === domain || host.endsWith(`.${domain}`);
  });
  res.json({
    domain,
    plan,
    daysCap,
    history: filtered.map((a) => ({
      id: a.id,
      url: a.url,
      geoScore: a.geoScore,
      createdAt: a.createdAt.toISOString(),
    })),
  });
});

// ─── Fix Generator ────────────────────────────────────────────────────────────
router.get("/geo/audits/:id/fixes", requireAuth, readRateLimiter, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAuditParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

  const plan = await getUserPlan(req.userId!);
  // Gate on the plan-limits flag (Starter and up), not a hard-coded tier —
  // the pricing page and Stripe product description sell the Fix Generator
  // starting at Starter, so the gate must match what customers pay for.
  if (!PLAN_LIMITS[plan].fixGenerator) {
    res.status(403).json({ error: "Fix Generator is available on Starter and up. Upgrade to download custom fixes.", upgradeRequired: true });
    return;
  }

  const [audit] = await db.select().from(auditsTable).where(
    and(eq(auditsTable.id, params.data.id), eq(auditsTable.userId, req.userId!))
  );
  if (!audit) { res.status(404).json({ error: "Audit not found" }); return; }

  const hostname = (() => { try { return new URL(audit.url).hostname; } catch { return audit.url; } })();
  const brandName = (audit.brandName as string | null) || hostname.replace(/^www\./, "").split(".")[0];
  const description = (audit.description as string | null) || `${brandName} — website`;

  // llms.txt is optional and low-impact. Keep it available for teams that
  // want it, but do not imply that training bots control citations.
  const schemaDetected = ((audit.schemaTypes as any[]) || []).filter((s: any) => s.present).map((s: any) => s.type);
  const citationCrawlerNames = new Set(["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "BingBot", "Applebot"]);
  const crawlersBlocked = ((audit.crawlers as any[]) || []).filter((c: any) => !c.allowed && citationCrawlerNames.has(c.name)).map((c: any) => c.name);
  const recs = ((audit.recommendations as any[]) || []).slice(0, 6);

  const llmsTxt = `# ${brandName}

> ${description}

## About

${brandName} is a website located at ${audit.url}. This llms.txt file is provided to help AI search engines and LLM crawlers understand the site's content and purpose.

## What we do

${description}

## Key Pages

- Homepage: ${audit.url}

## Contact

- Website: ${audit.url}

## AI search discovery

Citation access is controlled in robots.txt. This file is a human-readable content map and is not a substitute for allowing search-index and live-fetch bots.
`;

  // Build optimized JSON-LD schema
  const missingSchema = ((audit.schemaTypes as any[]) || []).filter((s: any) => !s.present).map((s: any) => s.type);
  const schemaBlocks: Record<string, any>[] = [];

  // Build sameAs from verified brand signals stored on the audit
  const brandSignals = (audit.brandSignals as any[]) || [];
  const sameAsCandidates: string[] = [];
  const wikiSignal = brandSignals.find((s: any) => s.source === "Wikipedia" && s.found && s.url);
  if (wikiSignal?.url) sameAsCandidates.push(wikiSignal.url);
  const ghSignal = brandSignals.find((s: any) => s.source === "GitHub" && s.found && s.detail);
  if (ghSignal?.detail) {
    const loginMatch = (ghSignal.detail as string).match(/@([A-Za-z0-9_-]+)/);
    if (loginMatch) {
      sameAsCandidates.push(`https://github.com/${loginMatch[1]}`);
    }
  }

  // Always include Organization + WebSite
  schemaBlocks.push({
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${audit.url}#organization`,
    "name": brandName,
    "url": audit.url,
    "description": description,
    // External profiles must be confirmed by the user before publishing.
    "sameAs": [],
  });

  schemaBlocks.push({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${audit.url}#website`,
    "url": audit.url,
    "name": brandName,
    "publisher": { "@id": `${audit.url}#organization` },
    "inLanguage": "en-US",
  });

  // FAQPage and BreadcrumbList describe visible page structures. A crawl
  // cannot safely invent those structures, so users must add the matching
  // visible content first and then create schema that mirrors it.

  // Robots.txt snippet for missing crawlers
  const robotsSnippet = crawlersBlocked.length > 0
    ? `# Add these rules to your robots.txt to allow AI crawlers:\n${crawlersBlocked.map((name: string) => {
        const agentMap: Record<string, string> = {
          GPTBot: "GPTBot",
          ClaudeBot: "ClaudeBot",
          PerplexityBot: "PerplexityBot",
          "Google-Extended": "Google-Extended",
          Applebot: "Applebot",
          "meta-externalagent": "meta-externalagent",
        };
        const agent = agentMap[name] || name;
        return `\nUser-agent: ${agent}\nAllow: /`;
      }).join("\n")}`
    : "# All major AI crawlers are already allowed in your robots.txt.";

  res.json({
    brandName,
    llmsTxt,
    schemaBlocks,
    sameAsCandidates,
    robotsSnippet,
    crawlersBlocked,
    missingSchema,
    schemaDetected,
    recommendations: recs.map((r: any) => ({ title: r.title, detail: r.detail, priority: r.priority })),
  });
});

export default router;
