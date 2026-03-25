import { NextRequest, NextResponse } from "next/server";

const RECIPIENT_EMAIL = process.env.CONTACT_EMAIL || "";

// Minimum message/description length to reject single-char spam
const MIN_MESSAGE_LENGTH = 10;

// Minimum elapsed time (ms) between form load and submit — bots submit instantly
const MIN_SUBMIT_TIME_MS = 2000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, groupName, city, state, email, description, message, formType, _hp_email, _ts } = body;

    // --- Spam Protection ---

    // 1. Honeypot: if the invisible field has a value, it's a bot
    if (_hp_email) {
      // Return success so the bot thinks it worked — don't reveal the trap
      console.log("[SPAM] Honeypot triggered:", { name, email });
      return NextResponse.json({ success: true });
    }

    // 2. Time-based check: reject submissions that happen too fast
    if (_ts) {
      const elapsed = Date.now() - Number(_ts);
      if (elapsed < MIN_SUBMIT_TIME_MS) {
        console.log("[SPAM] Too fast submission:", { name, email, elapsed });
        return NextResponse.json({ success: true });
      }
    }

    // 3. Required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    // 4. Minimum message length
    const messageText = message || description || "";
    if (messageText.trim().length < MIN_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message must be at least ${MIN_MESSAGE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // 5. Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // --- Passed spam checks, process the submission ---

    console.log("=== New Contact Form Submission ===");
    console.log(`To: ${RECIPIENT_EMAIL}`);
    console.log(`From: ${name} <${email}>`);
    console.log(`Type: ${formType || "general"}`);
    if (groupName) console.log(`Group: ${groupName}`);
    if (city && state) console.log(`Location: ${city}, ${state}`);
    if (messageText) console.log(`Message: ${messageText}`);
    console.log("===================================");

    // Example SendGrid integration (uncomment when ready):
    // const sgMail = require("@sendgrid/mail");
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: RECIPIENT_EMAIL,
    //   from: "noreply@mahjnearme.com",
    //   replyTo: email,
    //   subject: formType === "website-inquiry"
    //     ? `Website Inquiry from ${name}`
    //     : formType === "group-listing"
    //     ? `New Group Listing Request from ${name}`
    //     : `Contact Form from ${name}`,
    //   text: `Name: ${name}\nGroup: ${groupName || "N/A"}\nLocation: ${city || "N/A"}, ${state || "N/A"}\nEmail: ${email}\n\n${messageText}`,
    // });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
