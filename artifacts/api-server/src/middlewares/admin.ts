import type { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/express";

const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function isAdminRequest(req: Request): Promise<boolean> {
  if (!req.userId || adminEmails.length === 0) return false;
  try {
    const user = await clerkClient.users.getUser(req.userId);
    const emails = (user.emailAddresses || []).map((e) => e.emailAddress.toLowerCase());
    return emails.some((e) => adminEmails.includes(e));
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
