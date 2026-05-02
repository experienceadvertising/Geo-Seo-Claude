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
