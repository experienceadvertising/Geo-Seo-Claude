import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { Recommendation, SourceType, Severity, Category } from "./types.js";

export * from "./types.js";

// ---------------------------------------------------------------------------
// Load + validate the JSON catalog at module-load time. Validation failures
// throw, which fails the server boot — preferred over silently shipping a
// malformed catalog.
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../data/recommendations.json");

const VALID_SEVERITIES: ReadonlySet<Severity> = new Set(["critical", "high", "medium", "low"]);
const VALID_CATEGORIES: ReadonlySet<Category> = new Set([
  "answerability", "authority", "structure", "depth", "freshness", "technical", "entity",
]);
const VALID_SOURCE_TYPES: ReadonlySet<SourceType> = new Set([
  "research", "internal_benchmark", "practitioner_consensus",
]);

function isIsoDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

function validate(rec: unknown, idx: number): Recommendation {
  if (!rec || typeof rec !== "object") {
    throw new Error(`recommendations.json[${idx}] is not an object`);
  }
  const r = rec as Record<string, unknown>;
  const id = r.id;
  if (typeof id !== "string" || id.length === 0) {
    throw new Error(`recommendations.json[${idx}] is missing a string \`id\``);
  }
  const where = `recommendation '${id}'`;

  const requireString = (field: string): string => {
    const v = r[field];
    if (typeof v !== "string" || v.length === 0) {
      throw new Error(`${where} is missing required string field \`${field}\``);
    }
    return v;
  };

  requireString("titleTemplate");
  const claim = requireString("claim");
  if (/\d+(\.\d+)?\s*%/.test(claim) || /\d+(\.\d+)?\s*[x×]/i.test(claim)) {
    throw new Error(
      `${where} \`claim\` contains a precise quantitative figure ("${claim}"). ` +
      `Move precise numbers into \`expectedLift\` so they can be rendered with a source badge; ` +
      `keep \`claim\` qualitative.`
    );
  }
  requireString("sourceCitation");

  if (!VALID_SEVERITIES.has(r.severity as Severity)) {
    throw new Error(`${where} has invalid \`severity\`: ${JSON.stringify(r.severity)}`);
  }
  if (!VALID_CATEGORIES.has(r.category as Category)) {
    throw new Error(`${where} has invalid \`category\`: ${JSON.stringify(r.category)}`);
  }
  const sourceType = r.sourceType as SourceType;
  if (!VALID_SOURCE_TYPES.has(sourceType)) {
    throw new Error(`${where} has invalid \`sourceType\`: ${JSON.stringify(sourceType)}`);
  }

  // expectedLift: null OR a discriminated-union object
  if (r.expectedLift !== null) {
    const el = r.expectedLift as Record<string, unknown> | undefined;
    if (!el || typeof el !== "object") {
      throw new Error(`${where} \`expectedLift\` must be null or an object`);
    }
    if (el.kind !== "percent" && el.kind !== "multiplier" && el.kind !== "positions") {
      throw new Error(`${where} \`expectedLift.kind\` must be percent|multiplier|positions, got ${JSON.stringify(el.kind)}`);
    }
    if (typeof el.value !== "number" || !Number.isFinite(el.value)) {
      throw new Error(`${where} \`expectedLift.value\` must be a finite number`);
    }
    if (el.range !== undefined) {
      if (el.kind === "positions") {
        throw new Error(`${where} \`expectedLift.range\` not allowed when kind="positions"`);
      }
      const range = el.range as unknown;
      if (
        !Array.isArray(range) || range.length !== 2 ||
        typeof range[0] !== "number" || typeof range[1] !== "number" ||
        range[0] > range[1]
      ) {
        throw new Error(`${where} \`expectedLift.range\` must be [min, max] with min <= max`);
      }
    }
  }

  // sourceUrl rules
  const sourceUrl = r.sourceUrl;
  if (sourceUrl !== null && typeof sourceUrl !== "string") {
    throw new Error(`${where} \`sourceUrl\` must be string or null`);
  }
  if ((sourceType === "research" || sourceType === "internal_benchmark") && sourceUrl === null) {
    throw new Error(`${where} \`sourceUrl\` is required when sourceType="${sourceType}"`);
  }

  // verified / lastVerifiedAt invariants
  if (typeof r.verified !== "boolean") {
    throw new Error(`${where} \`verified\` must be boolean`);
  }
  if (r.verified && !isIsoDate(r.lastVerifiedAt)) {
    throw new Error(`${where} verified=true requires \`lastVerifiedAt\` as YYYY-MM-DD ISO date`);
  }
  if (!r.verified && r.lastVerifiedAt !== null) {
    throw new Error(`${where} verified=false requires \`lastVerifiedAt\` to be null`);
  }

  if (!isIsoDate(r.updatedAt)) {
    throw new Error(`${where} \`updatedAt\` is required as YYYY-MM-DD ISO date`);
  }

  // notes required for research + null lift
  if (sourceType === "research" && r.expectedLift === null) {
    if (typeof r.notes !== "string" || r.notes.trim().length === 0) {
      throw new Error(
        `${where} has sourceType=research with expectedLift=null but no notes field — ` +
        `explain why no number is published for this rec.`
      );
    }
  }

  // aliases: optional string[]
  if (r.aliases !== undefined) {
    if (!Array.isArray(r.aliases) || r.aliases.some((a) => typeof a !== "string")) {
      throw new Error(`${where} \`aliases\` must be an array of strings`);
    }
  }

  if (r.retired !== undefined && typeof r.retired !== "boolean") {
    throw new Error(`${where} \`retired\` must be boolean if present`);
  }

  return r as unknown as Recommendation;
}

function loadCatalog(): { byId: Map<string, Recommendation>; all: readonly Recommendation[] } {
  const raw = readFileSync(DATA_PATH, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error(`recommendations.json must be a JSON array, got ${typeof parsed}`);
  }
  const all: Recommendation[] = parsed.map((r, i) => validate(r, i));
  const byId = new Map<string, Recommendation>();
  for (const rec of all) {
    if (byId.has(rec.id)) throw new Error(`duplicate recommendation id: ${rec.id}`);
    byId.set(rec.id, rec);
    for (const alias of rec.aliases ?? []) {
      if (byId.has(alias)) {
        throw new Error(`alias '${alias}' on rec '${rec.id}' collides with existing id/alias`);
      }
      byId.set(alias, rec);
    }
  }
  return { byId, all };
}

const CATALOG = loadCatalog();

/** All non-retired recommendations in declaration order. */
export const RECOMMENDATIONS: readonly Recommendation[] = CATALOG.all;

/**
 * Look up a recommendation by id or alias. Returns undefined if not found.
 * Resolves both current ids and historical aliases (for legacy report rendering).
 */
export function getRecommendation(id: string): Recommendation | undefined {
  return CATALOG.byId.get(id);
}

/** Get all recommendations, including retired ones (for legacy report rendering). */
export function getAllRecommendationsIncludingRetired(): readonly Recommendation[] {
  return CATALOG.all;
}
