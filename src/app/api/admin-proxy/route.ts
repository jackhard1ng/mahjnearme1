import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api-auth";

export const runtime = "nodejs";
// The proxy has to stay alive for as long as the downstream route it calls.
// Bulk imports (e.g. /api/listings/import) can take tens of seconds for large
// paste imports, so we request the max allowed duration here too.
export const maxDuration = 60;

/**
 * POST /api/admin-proxy
 * Proxies admin panel requests to protected API routes.
 *
 * Auth: client must send Authorization: Bearer <Firebase ID token> for an
 * admin-level user. The proxy verifies that, then forwards the request with
 * CRON_SECRET attached so downstream routes' requireAdmin() check passes.
 *
 * Body: { route: "/api/subscribers", method: "GET", body?: any }
 */
export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // Verify the caller is an admin user (Firebase ID token in Authorization header)
  const authResult = await requireAdminUser(req);
  if (authResult instanceof NextResponse) return authResult;

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
