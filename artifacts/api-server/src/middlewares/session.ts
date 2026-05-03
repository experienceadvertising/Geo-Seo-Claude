import session from "express-session";
import connectPg from "connect-pg-simple";

declare module "express-session" {
  interface SessionData {
    userId: string;
    email: string;
  }
}

const PgStore = connectPg(session);

export function createSessionMiddleware() {
  const isProd = process.env.NODE_ENV === "production";
  const secret = process.env.SESSION_SECRET;
  if (isProd && !secret) {
    throw new Error("SESSION_SECRET is required in production.");
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
