export const CAMPAIGN_ID: string;
export function runNewsletter(
  action?: "--dry-run" | "--check-stream" | "--status" | "--test-to" | "--send",
  options?: { testTo?: string; postalAddress?: string; limit?: number },
): Promise<Record<string, unknown>>;
