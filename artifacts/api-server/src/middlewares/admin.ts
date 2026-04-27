import type { Request, Response, NextFunction } from "express";

const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function isAdminRequest(req: Request): Promise<boolean> {
  if (!req.userId || adminEmails.length === 0) return false;
  const sessionEmail = req.session?.email?.toLowerCase();
  return !!sessionEmail && adminEmails.includes(sessionEmail);
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!(await isAdminRequest(req))) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
