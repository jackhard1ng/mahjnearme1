import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
// The proxy has to stay alive for as long as the downstream route it calls.
// Bulk imports (e.g. /api/listings/import) can take tens of seconds for large
// paste imports, so we request the max allowed duration here too.
export const maxDuration = 60;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/**
 * POST /api/admin-proxy
 * Proxies admin panel requests to protected API routes by adding the CRON_SECRET.
 * Body: { route: "/api/subscribers", method: "GET", body?: any }
 *
 * Requires a valid Firebase ID token from an admin user.
 */
export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // Verify the caller is an authenticated admin user
  const authHeader = req.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const email = (decoded.email || "").toLowerCase();

    // Check against server-side admin list and Firestore accountType
    const isAdminEmail = ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(email);

    if (!isAdminEmail) {
      // Fallback: check Firestore for accountType === "admin"
      const { getAdminDb } = await import("@/lib/firebase-admin");
      const db = getAdminDb();
      const userDoc = await db.collection("users").doc(decoded.uid).get();
      const userData = userDoc.data();
      if (!userData || userData.accountType !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  try {
    const { route, method, body } = await req.json();

    // Only allow proxying to our own API routes
    const allowedPrefixes = ["/api/subscribers", "/api/billing-date", "/api/giveaway", "/api/organizers", "/api/contributor-activity", "/api/referrals", "/api/digest", "/api/claims", "/api/approvals", "/api/listings", "/api/organizer-apply", "/api/admin-link-organizer", "/api/instructors", "/api/organizer-referral", "/api/admin-sync-promoted"];
    if (!allowedPrefixes.some((p) => route.startsWith(p))) {
      return NextResponse.json({ error: "Route not allowed" }, { status: 403 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com";
    const fetchOpts: RequestInit = {
      method: method || "GET",
      headers: {
        "x-admin-key": cronSecret,
        "Content-Type": "application/json",
      },
    };
    if (body && method !== "GET") {
      fetchOpts.body = JSON.stringify(body);
    }

    const res = await fetch(`${baseUrl}${route}`, fetchOpts);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[Admin Proxy] Error:", err);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}
