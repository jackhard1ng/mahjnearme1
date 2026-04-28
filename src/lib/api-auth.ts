import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

// Hardcoded admin emails (mirror of AuthContext). Keep in sync.
const ADMIN_EMAILS = ["jack@fluttrr.com", "jack@mahjnearme.com"];

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
 * Verify the request comes from a logged-in admin user.
 * Expects: Authorization: Bearer <Firebase ID token>
 *
 * Returns { uid, email } on success, or a 401/403 NextResponse on failure.
 *
 * "Admin" means either:
 * - email is in ADMIN_EMAILS
 * - users/{uid}.accountType === "admin"
 */
export async function requireAdminUser(
  req: Request
): Promise<{ uid: string; email: string } | NextResponse> {
  const authHeader = req.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
  }
  const idToken = match[1].trim();

  let decoded: { uid: string; email?: string };
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch (err) {
    console.error("[requireAdminUser] verifyIdToken failed:", err);
    return NextResponse.json({ error: "Invalid auth token" }, { status: 401 });
  }

  const email = (decoded.email || "").toLowerCase();

  if (ADMIN_EMAILS.includes(email)) {
    return { uid: decoded.uid, email };
  }

  // Fall back to user doc accountType check
  try {
    const userDoc = await getAdminDb().collection("users").doc(decoded.uid).get();
    const accountType = userDoc.data()?.accountType;
    if (accountType === "admin") {
      return { uid: decoded.uid, email };
    }
  } catch (err) {
    console.error("[requireAdminUser] user lookup failed:", err);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
