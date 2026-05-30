import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function isAdminRequest(req: Request): Promise<boolean> {
  if (!req.userId || adminEmails.length === 0) return false;
  // Authorize against the user's CURRENT email in the database, not the value
  // frozen into the session at login. A session-cached email can go stale
  // (email changed/removed) and should never be the basis for admin access.
  try {
    const [user] = await db
      .select({ email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, req.userId));
    const email = user?.email?.toLowerCase();
    return !!email && adminEmails.includes(email);
  } catch {
    return false;
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!(await isAdminRequest(req))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
