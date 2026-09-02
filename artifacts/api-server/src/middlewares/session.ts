import session from "express-session";
import connectPg from "connect-pg-simple";
import { isProduction, isLocalDev } from "../lib/env";

declare module "express-session" {
  interface SessionData {
    userId: string;
    email: string;
    // CSRF state for the Google OAuth round-trip (set on /connect, verified on
    // /callback). Cleared once consumed.
    googleOAuthState?: string;
    googleOAuthReturnTo?: string;
  }
}

const PgStore = connectPg(session);

export function createSessionMiddleware() {
  const isProd = isProduction();
  const secret = process.env.SESSION_SECRET;
  // Only allow the predictable local fallback secret when NODE_ENV is
  // explicitly "development" or "test". Any other environment (including an
  // unset NODE_ENV on an internet-reachable preview/staging deploy) must
  // provide a real secret — otherwise sessions would be forgeable.
  if (!secret && !isLocalDev()) {
    throw new Error("SESSION_SECRET is required outside of development/test environments.");
  }
  return session({
    store: new PgStore({
      conString: process.env.DATABASE_URL!,
      tableName: "sessions",
      // Auto-create the `sessions` table on store init if it doesn't
      // exist. Sign-in was breaking with `relation "sessions" does not
      // exist` on environments where the table was never bootstrapped
      // (the schema is owned by connect-pg-simple, not Drizzle).
      // Idempotent — does nothing when the table is already present.
      createTableIfMissing: true,
    }),
    secret: secret || "local-dev-only-session-secret",
    resave: false,
    saveUninitialized: false,
    name: "aeo.sid",
    cookie: {
      secure: isProd,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  });
}
