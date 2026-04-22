import dns from "node:dns/promises";
import ipaddr from "ipaddr.js";

const MAX_REDIRECTS = 4;
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

export class SsrfError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "SsrfError";
  }
}

function isPrivateIp(addr: string): boolean {
  try {
    const parsed = ipaddr.parse(addr);
    const range = parsed.range();
    return range !== "unicast";
  } catch {
    return true;
  }
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (!hostname) throw new SsrfError("Empty hostname");
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost") || lower.endsWith(".local") || lower.endsWith(".internal")) {
    throw new SsrfError("Private/internal hostnames are not allowed");
  }
  if (ipaddr.isValid(hostname)) {
    if (isPrivateIp(hostname)) throw new SsrfError("Private/internal IP addresses are not allowed");
    return;
  }
  let records: { address: string; family: number }[];
  try {
    records = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new SsrfError(`DNS lookup failed for ${hostname}`);
  }
  for (const r of records) {
    if (isPrivateIp(r.address)) {
      throw new SsrfError(`Resolved IP is private/internal: ${r.address}`);
    }
  }
}

export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfError("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SsrfError("Only http(s) URLs are allowed");
  }
  if (parsed.username || parsed.password) {
    throw new SsrfError("URLs with credentials are not allowed");
  }
  await assertPublicHost(parsed.hostname);
  return parsed;
}

export interface SafeFetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxBytes?: number;
  method?: string;
}

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  headers: Headers;
  finalUrl: string;
  text(): Promise<string>;
  bytes(): Uint8Array;
}

export async function safeFetch(rawUrl: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = opts.timeoutMs ?? 15000;
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  let currentUrl = rawUrl;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const parsed = await assertPublicUrl(currentUrl);
    const res = await fetch(parsed.toString(), {
      method: opts.method ?? "GET",
      headers: opts.headers,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) {
        return wrap(res, parsed.toString(), maxBytes);
      }
      currentUrl = new URL(loc, parsed).toString();
      continue;
    }
    return wrap(res, parsed.toString(), maxBytes);
  }
  throw new SsrfError("Too many redirects");
}

async function wrap(res: Response, finalUrl: string, maxBytes: number): Promise<SafeFetchResult> {
  const reader = res.body?.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  if (reader) {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new SsrfError(`Response exceeded ${maxBytes} bytes`, 413);
        }
        chunks.push(value);
      }
    }
  }
  const buf = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buf.set(c, offset);
    offset += c.byteLength;
  }
  return {
    ok: res.ok,
    status: res.status,
    headers: res.headers,
    finalUrl,
    text: async () => new TextDecoder().decode(buf),
    bytes: () => buf,
  };
}
