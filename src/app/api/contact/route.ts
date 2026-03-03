import { NextRequest, NextResponse } from "next/server";

const RECIPIENT_EMAIL = process.env.CONTACT_EMAIL || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, groupName, city, state, email, description, formType } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    // In production, integrate with an email service (SendGrid, Resend, AWS SES, etc.)
    // For now, log the submission and return success
    // The email is sent server-side so the recipient address is never exposed to the client
    console.log("=== New Contact Form Submission ===");
    console.log(`To: ${RECIPIENT_EMAIL}`);
    console.log(`From: ${name} <${email}>`);
    console.log(`Type: ${formType || "group-listing"}`);
    if (groupName) console.log(`Group: ${groupName}`);
    if (city && state) console.log(`Location: ${city}, ${state}`);
    if (description) console.log(`Description: ${description}`);
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
    //     : `New Group Listing Request from ${name}`,
    //   text: `Name: ${name}\nGroup: ${groupName || "N/A"}\nLocation: ${city || "N/A"}, ${state || "N/A"}\nEmail: ${email}\n\n${description || ""}`,
    // });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
