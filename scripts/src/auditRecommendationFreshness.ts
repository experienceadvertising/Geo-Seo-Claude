/**
 * Freshness audit for the recommendation catalog.
 *
 * Prints a checklist of recommendations that are:
 *   - past their expiresAt date (must re-review immediately)
 *   - approaching expiry within 30 days (warning)
 *   - missing expiresAt (should be set)
 *   - not reviewed in the last 6 months (practitioner_consensus only)
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run freshness
 *
 * Run this monthly, or before each quarterly methodology refresh.
 * Any past-expiry item must be either re-reviewed (bump lastReviewedAt + expiresAt)
 * or retired (set retired: true) before the next deploy.
 */

import { RECOMMENDATIONS } from "@workspace/recommendations";

const today = new Date();
const todayMs = today.getTime();
const WARN_DAYS = 30;
const WARN_MS = WARN_DAYS * 24 * 60 * 60 * 1000;

type Status = "EXPIRED" | "EXPIRING_SOON" | "NO_EXPIRY" | "STALE_REVIEW" | "OK";

interface AuditRow {
  id: string;
  sourceType: string;
  title: string;
  expiresAt: string | null | undefined;
  lastReviewedAt: string | null | undefined;
  status: Status;
  detail: string;
}

const rows: AuditRow[] = [];

for (const rec of RECOMMENDATIONS) {
  if (rec.retired) continue;

  let status: Status = "OK";
  let detail = "";

  const expiresAt = rec.expiresAt ?? null;
  const lastReviewedAt = rec.lastReviewedAt ?? null;

  if (!expiresAt) {
    status = "NO_EXPIRY";
    detail = "No expiresAt set — add one per policy (research=24mo, benchmark=12mo, consensus=6mo)";
  } else {
    const expiryMs = Date.parse(expiresAt);
    if (Number.isNaN(expiryMs)) {
      status = "EXPIRED";
      detail = `expiresAt "${expiresAt}" is not a valid date`;
    } else if (expiryMs < todayMs) {
      const overdueDays = Math.floor((todayMs - expiryMs) / (24 * 60 * 60 * 1000));
      status = "EXPIRED";
      detail = `Expired ${overdueDays} day(s) ago (${expiresAt}). Re-review or retire.`;
    } else if (expiryMs - todayMs < WARN_MS) {
      const daysLeft = Math.ceil((expiryMs - todayMs) / (24 * 60 * 60 * 1000));
      status = "EXPIRING_SOON";
      detail = `Expires in ${daysLeft} day(s) (${expiresAt}). Schedule review.`;
    }
  }

  if (status === "OK" && rec.sourceType === "practitioner_consensus" && lastReviewedAt) {
    const reviewedMs = Date.parse(lastReviewedAt);
    if (!Number.isNaN(reviewedMs)) {
      const monthsAgo = (todayMs - reviewedMs) / (1000 * 60 * 60 * 24 * 30.44);
      if (monthsAgo > 6) {
        status = "STALE_REVIEW";
        detail = `Last reviewed ${Math.floor(monthsAgo)} month(s) ago (${lastReviewedAt}). Consensus recs should be reviewed every 6 months.`;
      }
    }
  }

  if (status !== "OK") {
    rows.push({
      id: rec.id,
      sourceType: rec.sourceType,
      title: rec.titleTemplate,
      expiresAt,
      lastReviewedAt: lastReviewedAt ?? null,
      status,
      detail,
    });
  }
}

const order: Record<Status, number> = { EXPIRED: 0, EXPIRING_SOON: 1, NO_EXPIRY: 2, STALE_REVIEW: 3, OK: 99 };
rows.sort((a, b) => order[a.status] - order[b.status]);

const icons: Record<Status, string> = {
  EXPIRED: "EXPIRED      ",
  EXPIRING_SOON: "EXPIRING SOON",
  NO_EXPIRY: "NO EXPIRY    ",
  STALE_REVIEW: "STALE REVIEW ",
  OK: "OK           ",
};

const today_str = today.toISOString().split("T")[0];
console.log(`\nAEO Improvement — Recommendation Freshness Audit`);
console.log(`Run date: ${today_str}`);
console.log(`Total active recommendations: ${RECOMMENDATIONS.filter(r => !r.retired).length}`);
console.log(`Issues found: ${rows.length}`);
console.log("─".repeat(90));

if (rows.length === 0) {
  console.log("All recommendations are current. Next review: check expiresAt dates above.");
} else {
  for (const r of rows) {
    console.log(`\n[${icons[r.status]}] ${r.id}`);
    console.log(`  Title:      ${r.title}`);
    console.log(`  SourceType: ${r.sourceType}`);
    console.log(`  Issue:      ${r.detail}`);
    if (r.lastReviewedAt) console.log(`  Last reviewed: ${r.lastReviewedAt}`);
  }
}

console.log("\n" + "─".repeat(90));
console.log("Fix: bump lastReviewedAt + expiresAt in lib/recommendations/data/recommendations.json");
console.log("     or set retired: true to soft-delete the recommendation.");
console.log("");

if (rows.some(r => r.status === "EXPIRED")) {
  process.exit(1);
}
