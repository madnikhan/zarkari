import crypto from "crypto";

const GRAPH = "https://graph.facebook.com/v21.0";

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() &&
      process.env.WHATSAPP_PHONE_NUMBER_ID?.trim()
  );
}

export function getWhatsAppVerifyToken(): string {
  return (
    process.env.WHATSAPP_VERIFY_TOKEN?.trim() ||
    process.env.META_VERIFY_TOKEN?.trim() ||
    ""
  );
}

export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret =
    process.env.META_APP_SECRET?.trim() ||
    process.env.META_WEBHOOK_SECRET?.trim() ||
    "";
  if (!secret || !signatureHeader?.startsWith("sha256=")) return false;
  const expected =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

export async function sendWhatsAppMessage(
  to: string,
  text: string
): Promise<{ messageId?: string; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneId) {
    return { error: "WhatsApp Cloud API not configured" };
  }

  const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });

  const data = (await res.json()) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    return { error: data.error?.message ?? `WhatsApp API error ${res.status}` };
  }
  return { messageId: data.messages?.[0]?.id };
}

export interface WhatsAppInboundMessage {
  from: string;
  messageId?: string;
  text: string;
  contactName?: string;
}

export function parseWhatsAppWebhook(body: unknown): WhatsAppInboundMessage[] {
  const messages: WhatsAppInboundMessage[] = [];
  const payload = body as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          messages?: Array<{
            from?: string;
            id?: string;
            type?: string;
            text?: { body?: string };
          }>;
          contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        };
      }>;
    }>;
  };

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const contacts = value?.contacts ?? [];
      for (const msg of value?.messages ?? []) {
        if (msg.type !== "text" || !msg.from) continue;
        const text = msg.text?.body?.trim();
        if (!text) continue;
        const contact = contacts.find((c) => c.wa_id === msg.from);
        messages.push({
          from: msg.from,
          messageId: msg.id,
          text,
          contactName: contact?.profile?.name,
        });
      }
    }
  }

  return messages;
}
