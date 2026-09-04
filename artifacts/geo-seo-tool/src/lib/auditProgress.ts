/** Compare the same fetched page, never unrelated sites or paths. */
export function sameAuditPage(first: string, second: string): boolean {
  try {
    const a = new URL(first); const b = new URL(second);
    a.hash = ""; b.hash = "";
    return a.href === b.href;
  } catch { return false; }
}
