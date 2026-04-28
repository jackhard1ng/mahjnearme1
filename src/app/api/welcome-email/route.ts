import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";
import { requireUser } from "@/lib/api-auth";

/**
 * POST /api/welcome-email — send the welcome email to the calling user.
 *
 * Auth: Authorization: Bearer <Firebase ID token>. The recipient email is
 * taken from the verified token, NOT the request body, so this cannot be
 * used as an open spam relay to send branded emails to arbitrary addresses.
 */
export async function POST(request: NextRequest) {
  const authResult = await requireUser(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { name } = (await request.json().catch(() => ({}))) as { name?: string };

    if (!authResult.email) {
      return NextResponse.json({ error: "Verified token has no email" }, { status: 400 });
    }

    await sendWelcomeEmail({
      to: authResult.email,
      name: name || "",
      isSubscriber: false,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 });
  }
}
