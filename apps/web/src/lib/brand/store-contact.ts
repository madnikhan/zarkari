/** Canonical store contact for invoices, footer, and contact page. */

export const STORE_BRAND_NAME = "Zarkari";

export const STORE_ADDRESS_LINES = [
  "438-A Stratford Road",
  "B11 4AD Birmingham UK",
] as const;

export const STORE_ADDRESS_ONE_LINE = "438-A Stratford Road, B11 4AD Birmingham UK";

/** Display form with spaces */
export const STORE_PHONE_DISPLAY = "+44 7863 176321";

/** Digits for wa.me / NEXT_PUBLIC_WHATSAPP_NUMBER fallback */
export const STORE_WHATSAPP_DIGITS = "447863176321";

export const STORE_SITE_URL = "https://zarkari.co.uk";

export const STORE_EMAIL = "hello@zarkari.co.uk";

export function getPublicWhatsAppDigits(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  return fromEnv || STORE_WHATSAPP_DIGITS;
}
