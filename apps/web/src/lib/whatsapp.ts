/** Normalize phone to digits for wa.me links (UK numbers: leading 0 → 44). */
export function normalizeWhatsAppPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `44${digits.slice(1)}`;
  if (!digits.startsWith("44") && digits.length <= 11) digits = `44${digits}`;
  return digits;
}

export function whatsAppUrl(phone: string, message?: string): string {
  const digits = normalizeWhatsAppPhone(phone);
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function orderConfirmationMessage(customerName: string, orderNumber: string): string {
  return orderTrackingMessage(customerName, orderNumber, getSiteUrl());
}

export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://zarkari.co.uk";
}

export function orderTrackingMessage(
  customerName: string,
  orderNumber: string,
  siteUrl: string
): string {
  const link = `${siteUrl.replace(/\/$/, "")}/my-order?order=${encodeURIComponent(orderNumber)}`;
  return `Hi ${customerName},

Your ZARKARI order ${orderNumber} is confirmed.

Track your order anytime:
${link}

Enter your order number and WhatsApp number on that page to see live status and updates.

Thank you,
ZARKARI`;
}
