export function isAcceptedRegistration(result: unknown): boolean {
  return typeof result === "object" && result !== null && (result as { accepted?: unknown }).accepted === true;
}

export function acceptedCheckoutUrl(result: unknown): string | null {
  if (typeof result !== "object" || result === null || typeof (result as { url?: unknown }).url !== "string") return null;
  try {
    const url = new URL((result as { url: string }).url);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
