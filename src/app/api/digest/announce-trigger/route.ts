import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api-auth";

/**
 * POST /api/digest/announce-trigger
 * Admin panel calls this, which adds the CRON_SECRET and forwards to /api/digest/announce.
 *
 * Auth: Authorization: Bearer <Firebase ID token> for an admin user.
 */
export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const authResult = await requireAdminUser(req);
  if (authResult instanceof NextResponse) return authResult;

  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com";

  try {
    const body = await req.json();
    const res = await fetch(`${baseUrl}/api/digest/announce`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cronSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Announce Trigger] Error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
