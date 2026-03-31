import { NextResponse } from "next/server";

/**
 * POST /api/digest/trigger
 * Admin-only endpoint to manually trigger the weekly digest.
 * Calls the main digest endpoint with the CRON_SECRET.
 */
export async function POST() {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || "https://www.mahjnearme.com";

  try {
    const res = await fetch(`${baseUrl}/api/digest`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cronSecret}`,
      },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Digest Trigger] Error:", err);
    return NextResponse.json({ error: "Failed to trigger digest" }, { status: 500 });
  }
}
