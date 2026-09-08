/** Store a URL as onboarding context only. The analyzer still validates network access. */
export function onboardingUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048 || !value.trim()) return null;
  try {
    const url = new URL(value.includes("://") ? value.trim() : `https://${value.trim()}`);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || !url.hostname.includes(".")) return null;
    url.hash = "";
    return url.toString();
  } catch { return null; }
}
