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
  return `Hi ${customerName}, your ZARKARI order ${orderNumber} is confirmed. Thank you!`;
}
