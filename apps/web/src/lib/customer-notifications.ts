import { orderTrackingMessage, normalizeWhatsAppPhone } from "@/lib/whatsapp";
import {
  isWhatsAppConfigured,
  sendWhatsAppMessage,
  sendWhatsAppTemplateMessage,
} from "@/lib/social-inbox/whatsapp-client";

export interface WhatsAppNotifyResult {
  sent: boolean;
  skipped?: boolean;
  error?: string;
}

export async function sendOrderTrackingWhatsApp(
  phone: string,
  customerName: string,
  orderNumber: string
): Promise<WhatsAppNotifyResult> {
  if (!isWhatsAppConfigured()) {
    return { sent: false, skipped: true, error: "WhatsApp Cloud API not configured" };
  }

  const to = normalizeWhatsAppPhone(phone);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zarkari.co.uk";
  const link = `${siteUrl.replace(/\/$/, "")}/my-order?order=${encodeURIComponent(orderNumber)}`;
  const templateName = process.env.WHATSAPP_ORDER_TEMPLATE_NAME?.trim();

  if (templateName) {
    const result = await sendWhatsAppTemplateMessage(to, templateName, [
      customerName,
      orderNumber,
      link,
    ]);
    if (result.error) return { sent: false, error: result.error };
    return { sent: true };
  }

  const text = orderTrackingMessage(customerName, orderNumber, siteUrl);
  const result = await sendWhatsAppMessage(to, text);
  if (result.error) {
    return {
      sent: false,
      skipped: true,
      error: `${result.error} (set WHATSAPP_ORDER_TEMPLATE_NAME for business-initiated messages)`,
    };
  }
  return { sent: true };
}
