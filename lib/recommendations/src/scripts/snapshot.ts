import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { RECOMMENDATIONS, RECOMMENDATIONS_SCHEMA_VERSION } from "../index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = resolve(__dirname, "../../snapshots");
const SNAPSHOT_PATH = resolve(SNAPSHOT_DIR, "recommendations.snapshot.json");

const update = process.argv.includes("--update");

const payload = {
  schemaVersion: RECOMMENDATIONS_SCHEMA_VERSION,
  count: RECOMMENDATIONS.length,
  recommendations: RECOMMENDATIONS,
};
const current = JSON.stringify(payload, null, 2) + "\n";

if (update || !existsSync(SNAPSHOT_PATH)) {
  if (!existsSync(SNAPSHOT_DIR)) mkdirSync(SNAPSHOT_DIR, { recursive: true });
  writeFileSync(SNAPSHOT_PATH, current);
  const verb = update ? "updated" : "created";
  console.log(`OK snapshot ${verb}: ${SNAPSHOT_PATH}`);
  console.log(`   ${RECOMMENDATIONS.length} recs, schema=${RECOMMENDATIONS_SCHEMA_VERSION}`);
  process.exit(0);
}

const stored = readFileSync(SNAPSHOT_PATH, "utf8");
if (stored === current) {
  console.log(`OK snapshot matches (${RECOMMENDATIONS.length} recs, schema=${RECOMMENDATIONS_SCHEMA_VERSION})`);
  process.exit(0);
}

const a = stored.split("\n");
const b = current.split("\n");
let diffCount = 0;
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  if (a[i] !== b[i]) diffCount++;
}
console.error("FAIL snapshot mismatch — recommendation catalog changed since last bless.");
console.error(`     ${diffCount} line(s) differ between catalog and snapshot.`);
console.error("");
console.error("     Inspect with:  git diff lib/recommendations/snapshots/");
console.error("     If intentional, re-bless with:");
console.error("       pnpm --filter @workspace/recommendations run snapshot:update");
process.exit(1);
