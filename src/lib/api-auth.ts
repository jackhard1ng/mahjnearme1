import { NextResponse } from "next/server";

/**
 * Check if a request is authorized for admin/internal access.
 * Accepts either:
 * - x-admin-key header matching CRON_SECRET (from admin-proxy)
 * - Authorization: Bearer <CRON_SECRET> header (from cron jobs)
 *
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export function requireAdmin(req: Request): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const adminKey = req.headers.get("x-admin-key");
  const authHeader = req.headers.get("authorization");

  if (adminKey === cronSecret) return null;
  if (authHeader === `Bearer ${cronSecret}`) return null;

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
