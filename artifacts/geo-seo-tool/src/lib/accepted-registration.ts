export function isAcceptedRegistration(result: unknown): boolean {
  return typeof result === "object" && result !== null && (result as { accepted?: unknown }).accepted === true;
}
