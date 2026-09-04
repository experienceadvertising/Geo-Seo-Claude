/** Compare page-level audit signals only for the same URL. Fragments do not
 * identify a different fetched page; paths, queries, schemes, and hosts do. */
export function sameAuditedPage(first: string, second: string): boolean {
  try {
    const a = new URL(first);
    const b = new URL(second);
    a.hash = "";
    b.hash = "";
    return a.href === b.href;
  } catch { return false; }
}
