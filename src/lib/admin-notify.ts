/**
 * Send a notification email to the admin when organizers submit changes.
 */

export async function notifyAdmin(subject: string, body: string): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const toEmail = process.env.CONTACT_EMAIL;

  if (!apiKey || !fromEmail || !toEmail) {
    console.log("[Admin Notify] Email not configured, skipping:", subject);
    return;
  }

  try {
    await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail }] }],
        from: { email: fromEmail, name: "MahjNearMe" },
        subject,
        content: [
          { type: "text/plain", value: body },
          { type: "text/html", value: `<div style="font-family:sans-serif;font-size:14px;color:#333">${body.replace(/\n/g, "<br>")}</div>` },
        ],
      }),
    });
  } catch (err) {
    console.error("[Admin Notify] Failed to send:", err);
  }
}
