import { NextResponse } from "next/server";

/**
 * POST /api/admin-proxy
 * Proxies admin panel requests to protected API routes by adding the CRON_SECRET.
 * Body: { route: "/api/subscribers", method: "GET", body?: any }
 */
export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const { route, method, body } = await req.json();

    // Only allow proxying to our own API routes
    const allowedPrefixes = ["/api/subscribers", "/api/billing-date", "/api/giveaway", "/api/organizers", "/api/contributor-activity", "/api/referrals", "/api/digest"];
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
