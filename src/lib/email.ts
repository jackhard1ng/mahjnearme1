/**
 * Email utility using SendGrid.
 *
 * Required env vars:
 *   SENDGRID_API_KEY - SendGrid API key
 *   CONTACT_EMAIL - Where form submissions go
 *   SENDGRID_FROM_EMAIL - Verified sender address
 */

import sgMail from "@sendgrid/mail";

let _initialized = false;

function init(): boolean {
  if (_initialized) return true;
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    console.error("[Email] SENDGRID_API_KEY is not set!");
    return false;
  }
  sgMail.setApiKey(key);
  _initialized = true;
  console.log("[Email] SendGrid initialized");
  return true;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<boolean> {
  const ready = init();

  // Read env vars at call time, not module load time
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@mahjnearme.com";

  const msg = {
    to: opts.to,
    from: fromEmail,
    subject: opts.subject,
    text: opts.text,
    html: opts.html || opts.text.replace(/\n/g, "<br/>"),
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
  };

  if (!ready) {
    console.log("[Email] NOT SENDING (no API key). Would send:", JSON.stringify({ to: msg.to, from: msg.from, subject: msg.subject }, null, 2));
    return false;
  }

  try {
    console.log("[Email] Sending to:", msg.to, "from:", msg.from, "subject:", msg.subject);
    await sgMail.send(msg);
    console.log("[Email] Sent successfully!");
    return true;
  } catch (err: unknown) {
    const sgErr = err as { response?: { body?: unknown }; message?: string };
    console.error("[Email] Send FAILED:", sgErr.message);
    if (sgErr.response?.body) {
      console.error("[Email] SendGrid error body:", JSON.stringify(sgErr.response.body));
    }
    return false;
  }
}

export async function sendContactNotification(data: {
  name: string;
  email: string;
  formType: string;
  groupName?: string;
  city?: string;
  state?: string;
  message?: string;
  description?: string;
  fullFormData?: Record<string, unknown>;
}): Promise<boolean> {
  const contactEmail = process.env.CONTACT_EMAIL || "contact@mahjnearme.com";
  const isGroupListing = data.formType === "group-listing";
  const messageText = data.message || data.description || "";

  const subject = isGroupListing
    ? `New Group Listing: ${data.groupName || data.name}`
    : `Contact Form: ${data.name}`;

  let body = `Name: ${data.name}\nEmail: ${data.email}\n`;
  if (data.groupName) body += `Group: ${data.groupName}\n`;
  if (data.city && data.state) body += `Location: ${data.city}, ${data.state}\n`;
  body += `\n${messageText}`;

  if (data.fullFormData) {
    body += "\n\n--- Full Form Data ---\n";
    for (const [key, value] of Object.entries(data.fullFormData)) {
      if (key.startsWith("_") || !value) continue;
      body += `${key}: ${Array.isArray(value) ? value.join(", ") : value}\n`;
    }
  }

  return sendEmail({
    to: contactEmail,
    subject,
    text: body,
    replyTo: data.email,
  });
}

export async function sendWelcomeEmail(data: {
  to: string;
  name: string;
  isSubscriber: boolean;
  plan?: string;
}): Promise<boolean> {
  const subject = data.isSubscriber
    ? "Welcome to MahjNearMe — you're all set!"
    : "Welcome to MahjNearMe!";

  const html = data.isSubscriber
    ? `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto"><div style="background:#FF1493;padding:24px;text-align:center;border-radius:12px 12px 0 0"><h1 style="color:white;margin:0;font-size:24px">Welcome to MahjNearMe!</h1></div><div style="background:white;padding:32px;border:1px solid #eee;border-radius:0 0 12px 12px"><p>Hi ${data.name || "there"},</p><p>Thanks for subscribing! Your <strong>${data.plan === "annual" ? "annual" : "monthly"}</strong> plan is active.</p><ul><li>Full details on every listing</li><li>Addresses and directions for 2,000+ games</li><li>Automatic entry in our monthly giveaway</li></ul><p><a href="https://www.mahjnearme.com/search" style="color:#FF1493;font-weight:bold">Start searching →</a></p></div></div>`
    : `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto"><div style="background:#FF1493;padding:24px;text-align:center;border-radius:12px 12px 0 0"><h1 style="color:white;margin:0;font-size:24px">Welcome to MahjNearMe!</h1></div><div style="background:white;padding:32px;border:1px solid #eee;border-radius:0 0 12px 12px"><p>Hi ${data.name || "there"},</p><p>Thanks for joining! Search 2,000+ mahjong games across 50 states.</p><p><a href="https://www.mahjnearme.com/search" style="color:#FF1493;font-weight:bold">Start searching →</a></p></div></div>`;

  return sendEmail({
    to: data.to,
    subject,
    text: data.isSubscriber
      ? `Welcome to MahjNearMe! Your ${data.plan} plan is active. Start searching at https://www.mahjnearme.com/search`
      : `Welcome to MahjNearMe! Start searching at https://www.mahjnearme.com/search`,
    html,
  });
}
