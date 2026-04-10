import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

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

/**
 * Verify a Firebase ID token from the Authorization header and ensure
 * the authenticated user matches the given userId.
 *
 * Returns null if valid, or a 401/403 NextResponse if not.
 */
export async function requireUser(
  req: Request,
  userId: string
): Promise<NextResponse | null> {
  const authHeader = req.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!idToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);

    if (decoded.uid !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return null;
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }
}
