import { ApiError } from "@workspace/api-client-react";

/** The API's JSON error envelope: `{ error: string, code?: string, ... }`. */
type ErrorEnvelope = { error?: unknown; code?: unknown };

function envelope(err: unknown): ErrorEnvelope | null {
  if (err instanceof ApiError && err.data && typeof err.data === "object") {
    return err.data as ErrorEnvelope;
  }
  return null;
}

/** Server-supplied human message from an `ApiError`, else the fallback.
 * Deliberately ignores `err.message`, which is the transport-level
 * "HTTP 403 Forbidden: …" string and not something to show users. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const message = envelope(err)?.error;
  return typeof message === "string" && message ? message : fallback;
}

/** Machine-readable `code` from an `ApiError` envelope, if any. */
export function apiErrorCode(err: unknown): string | null {
  const code = envelope(err)?.code;
  return typeof code === "string" ? code : null;
}

/** HTTP status of an `ApiError`, else null (network failure, thrown Error). */
export function apiErrorStatus(err: unknown): number | null {
  return err instanceof ApiError ? err.status : null;
}
