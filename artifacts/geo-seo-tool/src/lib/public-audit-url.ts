export function publicAuditUrl(input: string): URL {
  const value = input.trim();
  const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  // DNS and redirect validation still run on the server. Keep obviously private targets out of signup.
  if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password || !host.includes(".") ||
      /(^|\.)(localhost|local|internal)$/.test(host) || host.includes(":") ||
      /^(0|10|127|169\.254|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host) ||
      /^(22[4-9]|23\d|24\d|25[0-5])\./.test(host)) {
    throw new Error("Enter a publicly reachable website, such as example.com.");
  }
  return parsed;
}
