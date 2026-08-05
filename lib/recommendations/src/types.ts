/**
 * Schema for the GEO recommendation catalog.
 *
 * The JSON file at `data/recommendations.json` is the SINGLE SOURCE OF TRUTH
 * for what each recommendation means and where its quantitative claims (if any)
 * come from. The page-analysis trigger code in api-server decides WHEN each
 * recommendation fires; it does not own its metadata.
 *
 * Backed-by-research vs. consensus distinction is enforced by the loader:
 *   - sourceType="research" REQUIRES a sourceUrl AND, if expectedLift is null,
 *     a non-empty notes field explaining why no precise number is published.
 *   - sourceType="internal_benchmark" REQUIRES a sourceUrl (typically a path
 *     into our /methodology page where the benchmark methodology is documented).
 *   - sourceType="practitioner_consensus" allows sourceUrl to be null.
 *
 * Schema version is exposed on the API response (recommendationsSchemaVersion)
 * so the client can fork rendering for legacy reports stored before this lib
 * existed (those reports have neither schemaVersion nor source metadata and
 * render without source badges).
 */

export const RECOMMENDATIONS_SCHEMA_VERSION = "v1" as const;

/**
 * Human-readable methodology version, updated on each quarterly refresh.
 * Format: "YYYY.MM" of the review month.
 * Rendered on the /methodology page and included in audit API responses.
 */
export const METHODOLOGY_VERSION = "2026.08" as const;

export type Severity = "critical" | "high" | "medium" | "low";

export type Category =
  | "answerability"
  | "authority"
  | "structure"
  | "depth"
  | "freshness"
  | "technical"
  | "entity";

export type SourceType = "research" | "internal_benchmark" | "practitioner_consensus";

/**
 * Quantitative lift claim, structured so the UI can render the unit correctly.
 *
 * `range` semantics — IMPORTANT:
 *   `range` represents the SOURCE'S REPORTED RANGE across the categories or
 *   prompt classes the source itself reports on (e.g. a paper reporting
 *   "30.3% on average across prompts, with individual prompt categories ranging
 *   18%-47%"). It is NOT a statistical confidence interval and it is NOT an
 *   A/B-test 95% CI. If we ever need to surface confidence intervals, add a
 *   separate `confidenceInterval` field — do not overload `range`.
 */
export type ExpectedLift =
  | { kind: "percent"; value: number; range?: [number, number] }
  | { kind: "multiplier"; value: number; range?: [number, number] }
  | { kind: "positions"; value: number };

export interface Recommendation {
  /** Stable slug. Never rename in place — use `aliases` for renames. */
  id: string;

  /**
   * Human-readable title. May contain `{placeholders}` resolved at render
   * time by the trigger code (e.g. "Cite {prevYear}/{currentYear} statistics").
   * Placeholders are not validated against a schema — convention only.
   */
  titleTemplate: string;

  /**
   * Plain-English explanation of WHY this recommendation matters.
   * MUST NOT contain a precise quantitative figure — those live in
   * `expectedLift` so they can be rendered with a source citation badge.
   * If a claim's research backing is qualitative-only, frame the claim
   * qualitatively here and put the explanation in `notes`.
   */
  claim: string;

  severity: Severity;
  category: Category;

  /**
   * Structured lift claim. Set to null when no defensible precise number
   * exists; surface qualitative wording via `claim` instead.
   */
  expectedLift: ExpectedLift | null;

  sourceType: SourceType;

  /**
   * URL to the source. REQUIRED when sourceType is "research" or
   * "internal_benchmark"; allowed-null only for "practitioner_consensus".
   */
  sourceUrl: string | null;

  /** Human-readable citation, e.g. "Aggarwal et al., KDD 2024, §4.2". */
  sourceCitation: string;

  /** True only if a human has confirmed the claim against the cited source. */
  verified: boolean;

  /** ISO date of last verification. REQUIRED when verified=true; null otherwise. */
  lastVerifiedAt: string | null;

  /**
   * ISO date of the last edit to THIS RECORD (any field). Distinct from
   * lastVerifiedAt — you can fix a typo without re-verifying the source.
   * Required.
   */
  updatedAt: string;

  /**
   * ISO date this recommendation was last reviewed for continued relevance,
   * independent of source verification. Updated on each quarterly methodology
   * refresh even when no content changes. Optional (null = never explicitly reviewed).
   */
  lastReviewedAt?: string | null;

  /**
   * ISO date after which this recommendation should be re-reviewed.
   * Policy: research = 24 months, internal_benchmark = 12 months,
   * practitioner_consensus = 6 months. The freshness audit script
   * (scripts/src/auditRecommendationFreshness.ts) flags past-expiry entries.
   * Optional — absence means no expiry set yet.
   */
  expiresAt?: string | null;

  /**
   * Editorial notes shown on the methodology page. Use for hedging,
   * context, why a precise number was removed, etc. NOT injected into LLM
   * prompts. REQUIRED when sourceType="research" AND expectedLift=null.
   */
  notes?: string;

  /** Old ids this recommendation replaced (for backward compatibility). */
  aliases?: string[];

  /**
   * Soft-delete: when true, this rec is no longer surfaced in NEW audits
   * but is still resolvable for historical reports.
   */
  retired?: boolean;
}
