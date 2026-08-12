type ClientErrorKind = "render_error" | "window_error" | "unhandled_rejection";

const reported = new Set<string>();

function cleanMessage(value: unknown): string {
  const message = value instanceof Error ? value.message : String(value ?? "Unknown client error");
  return message
    .replace(/https?:\/\/[^\s]+/gi, "[url]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/(?:bearer\s+|token[=:]\s*)[^\s,;]+/gi, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

export function reportClientError(kind: ClientErrorKind, error: unknown): void {
  const message = cleanMessage(error);
  const route = window.location.pathname;
  const key = `${kind}:${route}:${message}`;
  if (reported.has(key)) return;
  reported.add(key);

  // Keep this independent of the API client: API failures must not recurse.
  void fetch("/api/telemetry/client-error", {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, message, route }),
  }).catch(() => undefined);
}

export function installClientErrorReporting(): void {
  window.addEventListener("error", (event) => {
    reportClientError("window_error", event.error ?? event.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    reportClientError("unhandled_rejection", event.reason);
  });
}
