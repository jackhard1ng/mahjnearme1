/**
 * Email utility using SendGrid.
 *
 * Required env vars:
 *   SENDGRID_API_KEY - SendGrid API key
 *   CONTACT_EMAIL - Where form submissions go (e.g. hello@mahjnearme.com)
 *   SENDGRID_FROM_EMAIL - Verified sender (e.g. noreply@mahjnearme.com)
 */

import sgMail from "@sendgrid/mail";

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@mahjnearme.com";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "hello@mahjnearme.com";

let _initialized = false;

function init() {
  if (_initialized) return;
  const key = process.env.SENDGRID_API_KEY;
  if (!key) {
    console.warn("[Email] SENDGRID_API_KEY not set — emails will be logged only");
    return;
  }
  sgMail.setApiKey(key);
  _initialized = true;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}): Promise<boolean> {
  init();

  const msg = {
    to: opts.to,
    from: FROM_EMAIL,
    subject: opts.subject,
    text: opts.text,
    html: opts.html || opts.text.replace(/\n/g, "<br/>"),
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
  };

  if (!process.env.SENDGRID_API_KEY) {
    console.log("[Email] Would send:", JSON.stringify(msg, null, 2));
    return true;
  }

  try {
    await sgMail.send(msg);
    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}

/** Send a contact form or group listing submission to the site owner. */
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
    to: CONTACT_EMAIL,
    subject,
    text: body,
    replyTo: data.email,
  });
}

/** Send a welcome email to a new user. */
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
    ? `
<div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
  <div style="background: #FF1493; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to MahjNearMe!</h1>
  </div>
  <div style="background: white; padding: 32px; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
    <p>Hi ${data.name || "there"},</p>
    <p>Thanks for subscribing! Your <strong>${data.plan === "annual" ? "annual" : "monthly"}</strong> plan is active. Here's what you get:</p>
    <ul>
      <li>Full details on every listing — names, venues, contact info</li>
      <li>Addresses and directions for 2,000+ games across 50 states</li>
      <li>Schedules, descriptions, and how-to-join info</li>
      <li>Automatic entry in our monthly mahjong giveaway</li>
    </ul>
    <p><a href="https://www.mahjnearme.com/search" style="color: #FF1493; font-weight: bold;">Start searching →</a></p>
    <p style="color: #999; font-size: 13px; margin-top: 24px;">Questions? Reply to this email or contact us at hello@mahjnearme.com</p>
  </div>
</div>`
    : `
<div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
  <div style="background: #FF1493; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to MahjNearMe!</h1>
  </div>
  <div style="background: white; padding: 32px; border: 1px solid #eee; border-radius: 0 0 12px 12px;">
    <p>Hi ${data.name || "there"},</p>
    <p>Thanks for joining! With your free account you can:</p>
    <ul>
      <li>Search all 2,000+ mahjong games across 50 states</li>
      <li>See the map with all game pins</li>
      <li>View full details on the top result in each search</li>
    </ul>
    <p>Want full details on every listing? <a href="https://www.mahjnearme.com/pricing" style="color: #FF1493; font-weight: bold;">See our plans →</a></p>
    <p><a href="https://www.mahjnearme.com/search" style="color: #FF1493; font-weight: bold;">Start searching →</a></p>
    <p style="color: #999; font-size: 13px; margin-top: 24px;">Questions? Reply to this email or contact us at hello@mahjnearme.com</p>
  </div>
</div>`;

  return sendEmail({
    to: data.to,
    subject,
    text: data.isSubscriber
      ? `Welcome to MahjNearMe! Your ${data.plan} plan is active. Start searching at https://www.mahjnearme.com/search`
      : `Welcome to MahjNearMe! Start searching at https://www.mahjnearme.com/search`,
    html,
  });
}
