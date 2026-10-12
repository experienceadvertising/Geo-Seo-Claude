/** Reject an unavailable observation instead of reporting a measured zero. */
export function requireSuccessfulSample(results: Array<{ engines: Array<{ error: string | null }> }>): void {
  if (!results.some(row => row.engines.some(answer => !answer.error))) {
    throw new Error("No AI answers were returned successfully. Visibility is unavailable. Please try again later.");
  }
}

export function observedRobotsText(status: number, contentType: string, text: string): string {
  if (status === 404 || status === 410) return "";
  if (status < 200 || status >= 300 || /html/i.test(contentType) || /^\s*(<!doctype html|<html)/i.test(text)) {
    throw new Error("Crawler access could not be verified because robots.txt was unavailable or returned HTML. Try again later.");
  }
  return text;
}
