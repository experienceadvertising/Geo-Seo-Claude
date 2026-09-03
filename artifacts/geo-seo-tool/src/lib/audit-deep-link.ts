const AUDIT_SECTION_IDS = new Set([
  "recommendations",
  "seo-opportunities",
  "technical-breakdown",
]);

export function getAuditDeepLinkState(search: string, hash: string) {
  const requestedId = hash.replace(/^#/, "");
  return {
    showTechnicalDetails: new URLSearchParams(search).get("details") === "1",
    targetId: AUDIT_SECTION_IDS.has(requestedId) ? requestedId : null,
  };
}
