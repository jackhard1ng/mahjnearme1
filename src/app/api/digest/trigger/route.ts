import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/api-auth";

/**
 * POST /api/digest/trigger?type=newEvents|digest
 * Admin-only endpoint to manually trigger notifications.
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

  const url = new URL(req.url);
  const sendType = url.searchParams.get("type") || "digest";
  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com";

  try {
    const res = await fetch(`${baseUrl}/api/digest?type=${sendType}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${cronSecret}` },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Digest Trigger] Error:", err);
    return NextResponse.json({ error: "Failed to trigger" }, { status: 500 });
  }
}
