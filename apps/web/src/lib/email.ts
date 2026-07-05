const RESEND_KEY = process.env.RESEND_API_KEY?.trim();

export async function sendEmail(opts: { to: string; subject: string; html: string }) {
  if (!RESEND_KEY || RESEND_KEY.includes("placeholder")) {
    console.log(`[email demo] To: ${opts.to} | ${opts.subject}`);
    return { demo: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? "orders@zarkari.co.uk",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });
  if (!res.ok) throw new Error("Email send failed");
  return res.json();
}

export async function sendOrderConfirmation(email: string, orderNumber: string, total: string) {
  return sendEmail({
    to: email,
    subject: `ZARKARI Order Confirmation — ${orderNumber}`,
    html: `<p>Thank you for your order <strong>${orderNumber}</strong>.</p><p>Total: £${total}</p>`,
  });
}

export async function sendStageUpdateEmail(email: string, orderNumber: string, stage: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zarkari.co.uk";
  return sendEmail({
    to: email,
    subject: `Order Update — ${orderNumber}`,
    html: `<p>Your order <strong>${orderNumber}</strong> is now: ${stage}.</p><p><a href="${siteUrl}/my-order">Track your order</a></p>`,
  });
}
