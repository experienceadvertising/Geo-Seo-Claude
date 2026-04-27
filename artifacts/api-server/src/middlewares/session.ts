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
  return session({
    store: new PgStore({
      conString: process.env.DATABASE_URL!,
      tableName: "sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "aeo-fallback-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    name: "aeo.sid",
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  });
}
