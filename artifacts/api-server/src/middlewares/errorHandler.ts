import type { Request, Response, NextFunction } from "express";
// Explicit extension so the file is loadable by node --experimental-strip-types
// (the regression tests import it directly); esbuild and tsc accept it too.
import { SsrfError } from "../lib/safeFetch.ts";

/** JSON 404 for any unmatched `/api/*` path so clients never receive the
 * default Express HTML page. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: "Not found", path: req.path });
}

interface HttpishError {
  status?: unknown;
  statusCode?: unknown;
  type?: unknown;
  expose?: unknown;
  message?: unknown;
}

/**
 * Last-resort JSON error handler. Express 5 forwards rejected async handlers
 * here automatically; without this, an unexpected throw renders Express's
 * default HTML error page (including a stack trace outside production).
 *
 * Client-caused errors keep their status (body-parser 400/413, SsrfError,
 * anything with a 4xx `status`); everything else becomes an opaque 500 and
 * is logged with the request id so it can be correlated.
 */
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const e = (err ?? {}) as HttpishError;
  const rawStatus = typeof e.status === "number" ? e.status : typeof e.statusCode === "number" ? e.statusCode : undefined;

  if (err instanceof SsrfError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // body-parser errors (malformed JSON, payload too large, ...) carry a 4xx
  // status and a stable `type` — safe to surface to the caller.
  if (rawStatus && rawStatus >= 400 && rawStatus < 500) {
    const message =
      e.type === "entity.too.large"
        ? "Request body too large"
        : e.type === "entity.parse.failed"
          ? "Malformed JSON body"
          : e.expose === true && typeof e.message === "string"
            ? e.message
            : "Bad request";
    res.status(rawStatus).json({ error: message });
    return;
  }

  req.log?.error({ err, userId: req.userId }, "Unhandled route error");
  res.status(500).json({ error: "Internal server error" });
}
