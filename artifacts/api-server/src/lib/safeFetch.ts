import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import ipaddr from "ipaddr.js";

const MAX_REDIRECTS = 4;
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
const DNS_TIMEOUT_MS = 5000;

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
    records = await Promise.race([
      dns.promises.lookup(hostname, { all: true, verbatim: true }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new SsrfError(`DNS lookup timed out for ${hostname}`, 504)), DNS_TIMEOUT_MS).unref(),
      ),
    ]);
  } catch (err) {
    throw err instanceof SsrfError ? err : new SsrfError(`DNS lookup failed for ${hostname}`);
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

/**
 * A DNS lookup that validates every resolved address against the private/
 * internal block-list and only hands a vetted public IP back to the socket
 * layer. Because the HTTP(S) agent connects to *this* address (rather than
 * re-resolving the hostname itself), there is no TOCTOU/DNS-rebinding window
 * between the SSRF check and the actual connection — the address that was
 * validated is the address that gets connected to.
 */
const pinnedLookup: NonNullable<https.AgentOptions["lookup"]> = (hostname, options, callback) => {
  // `options` may be a number (legacy family arg) or an object.
  const opts = typeof options === "number" ? { family: options } : (options ?? {});
  dns.lookup(hostname, { ...opts, all: true, verbatim: true }, (err, addresses) => {
    if (err) {
      callback(err, "", 4);
      return;
    }
    const list = Array.isArray(addresses) ? addresses : [];
    if (list.length === 0) {
      callback(new SsrfError(`DNS lookup returned no records for ${hostname}`), "", 4);
      return;
    }
    // Strict: reject the whole connection if ANY resolved record is private,
    // matching assertPublicHost's behaviour and preventing a mixed
    // public/private answer from sneaking a private hop through.
    for (const a of list) {
      if (isPrivateIp(a.address)) {
        callback(new SsrfError(`Resolved IP is private/internal: ${a.address}`), "", a.family);
        return;
      }
    }
    if ((opts as { all?: boolean }).all) {
      callback(null, list as never, 0 as never);
    } else {
      callback(null, list[0].address, list[0].family);
    }
  });
};

const httpAgent = new http.Agent({ keepAlive: false, lookup: pinnedLookup });
const httpsAgent = new https.Agent({ keepAlive: false, lookup: pinnedLookup });

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

interface RawResponse {
  status: number;
  headers: Headers;
  location: string | null;
  body: Uint8Array;
}

function requestOnce(
  parsed: URL,
  method: string,
  headers: Record<string, string>,
  timeoutMs: number,
  maxBytes: number,
): Promise<RawResponse> {
  return new Promise<RawResponse>((resolve, reject) => {
    const isHttps = parsed.protocol === "https:";
    const lib = isHttps ? https : http;
    const req = lib.request(
      parsed,
      {
        method,
        agent: isHttps ? httpsAgent : httpAgent,
        // Identity encoding keeps response bytes equal to the decoded body
        // (Node's http does not auto-decompress) and side-steps gzip/br
        // decompression bombs — the byte cap below then bounds memory.
        headers: { "accept-encoding": "identity", ...headers },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const outHeaders = new Headers();
        for (const [k, v] of Object.entries(res.headers)) {
          if (Array.isArray(v)) outHeaders.set(k, v.join(", "));
          else if (v != null) outHeaders.set(k, v);
        }
        const location = typeof res.headers.location === "string" ? res.headers.location : null;

        const chunks: Buffer[] = [];
        let total = 0;
        let aborted = false;
        res.on("data", (chunk: Buffer) => {
          if (aborted) return;
          total += chunk.byteLength;
          if (total > maxBytes) {
            aborted = true;
            req.destroy();
            reject(new SsrfError(`Response exceeded ${maxBytes} bytes`, 413));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => {
          if (aborted) return;
          resolve({ status, headers: outHeaders, location, body: new Uint8Array(Buffer.concat(chunks)) });
        });
        res.on("error", (err) => {
          if (!aborted) reject(err);
        });
      },
    );

    // `setTimeout` on the request is an IDLE timeout — a server trickling a
    // byte every few seconds would keep a "15s" request alive until maxBytes.
    // Pair it with a hard wall-clock deadline for the whole exchange.
    req.setTimeout(timeoutMs, () => {
      req.destroy(new SsrfError("Request timed out", 504));
    });
    const deadline = setTimeout(() => {
      req.destroy(new SsrfError("Request exceeded time budget", 504));
    }, timeoutMs);
    req.on("error", (err) => {
      reject(err instanceof SsrfError ? err : new SsrfError(`Fetch failed: ${err.message}`, 502));
    });
    req.on("close", () => clearTimeout(deadline));
    req.end();
  });
}

export async function safeFetch(rawUrl: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = opts.timeoutMs ?? 15000;
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const method = opts.method ?? "GET";
  const headers = opts.headers ?? {};
  let currentUrl = rawUrl;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const parsed = await assertPublicUrl(currentUrl);
    const res = await requestOnce(parsed, method, headers, timeoutMs, maxBytes);

    if (res.status >= 300 && res.status < 400 && res.location) {
      currentUrl = new URL(res.location, parsed).toString();
      continue;
    }

    const body = res.body;
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      headers: res.headers,
      finalUrl: parsed.toString(),
      text: async () => new TextDecoder().decode(body),
      bytes: () => body,
    };
  }
  throw new SsrfError("Too many redirects");
}
