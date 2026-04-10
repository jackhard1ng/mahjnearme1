import { NextRequest, NextResponse } from "next/server";
import { sendContactNotification } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

// Minimum message/description length to reject single-char spam
const MIN_MESSAGE_LENGTH = 10;

// Minimum elapsed time (ms) between form load and submit — bots submit instantly
const MIN_SUBMIT_TIME_MS = 2000;

export async function POST(request: NextRequest) {
  const { limited } = rateLimit(request, { key: "contact", limit: 5, windowSeconds: 300 });
  if (limited) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  }

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

    console.log("[Contact] Submission received:", { formType: formType || "general" });

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
