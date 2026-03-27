import { NextRequest, NextResponse } from "next/server";
import { sendContactNotification } from "@/lib/email";

// Minimum message/description length to reject single-char spam
const MIN_MESSAGE_LENGTH = 10;

// Minimum elapsed time (ms) between form load and submit — bots submit instantly
const MIN_SUBMIT_TIME_MS = 2000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, description, message, formType, _hp_email, _ts, ...rest } = body;

    // --- Spam Protection ---

    if (_hp_email) {
      console.log("[SPAM] Honeypot triggered:", { name, email });
      return NextResponse.json({ success: true });
    }

    if (_ts) {
      const elapsed = Date.now() - Number(_ts);
      if (elapsed < MIN_SUBMIT_TIME_MS) {
        console.log("[SPAM] Too fast submission:", { name, email, elapsed });
        return NextResponse.json({ success: true });
      }
    }

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const messageText = message || description || "";
    if (messageText.trim().length < MIN_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Message must be at least ${MIN_MESSAGE_LENGTH} characters.` }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    // --- Send email notification ---

    console.log("[Contact] Submission received:", { name, email, formType: formType || "general", groupName: rest.groupName });
    console.log("[Contact] SENDGRID_API_KEY set:", !!process.env.SENDGRID_API_KEY);
    console.log("[Contact] FROM:", process.env.SENDGRID_FROM_EMAIL || "noreply@mahjnearme.com");
    console.log("[Contact] TO:", process.env.CONTACT_EMAIL || "contact@mahjnearme.com");

    const sent = await sendContactNotification({
      name,
      email,
      formType: formType || "general",
      groupName: rest.groupName,
      city: rest.city,
      state: rest.state,
      message,
      description,
      fullFormData: rest,
    });

    console.log("[Contact] Email sent:", sent);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
