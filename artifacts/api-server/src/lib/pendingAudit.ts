export function normalizePendingAuditUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw || raw.length > 2_048) return null;
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (
      !/^https?:$/.test(parsed.protocol) ||
      !parsed.hostname.includes(".") ||
      parsed.username ||
      parsed.password
    ) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
