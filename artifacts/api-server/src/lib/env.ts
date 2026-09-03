/**
 * Single definition of "is this a production deployment".
 *
 * Replit autoscale deployments set REPLIT_DEPLOYMENT=1 but do NOT set
 * NODE_ENV (the `start` script never sets it either). Before this helper the
 * server had three different answers to the question: the session cookie's
 * `secure` flag and the CORS localhost allowance keyed off NODE_ENV only, so
 * a real deployment shipped a non-Secure session cookie and allowed
 * localhost origins.
 */
export function isProduction(): boolean {
  return process.env.REPLIT_DEPLOYMENT === "1" || process.env.NODE_ENV === "production";
}

/** Explicit local dev/test — the only contexts where insecure fallbacks
 * (predictable session secret, pretty logging) are acceptable. */
export function isLocalDev(): boolean {
  return !isProduction() && (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test");
}
