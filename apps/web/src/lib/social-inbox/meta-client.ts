import crypto from "crypto";

const GRAPH = "https://graph.facebook.com/v21.0";

export function isMetaConfigured(): boolean {
  return Boolean(
    process.env.META_PAGE_ACCESS_TOKEN?.trim() &&
      (process.env.META_APP_SECRET?.trim() || process.env.META_WEBHOOK_SECRET?.trim())
  );
}

export function getMetaAppSecret(): string {
  return (
    process.env.META_APP_SECRET?.trim() ||
    process.env.META_WEBHOOK_SECRET?.trim() ||
    ""
  );
}

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = getMetaAppSecret();
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

export async function sendMetaMessage(
  recipientId: string,
  text: string
): Promise<{ messageId?: string; error?: string }> {
  const token = process.env.META_PAGE_ACCESS_TOKEN?.trim();
  if (!token) return { error: "META_PAGE_ACCESS_TOKEN not configured" };

  const res = await fetch(`${GRAPH}/me/messages?access_token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
      messaging_type: "RESPONSE",
    }),
  });

  const data = (await res.json()) as {
    message_id?: string;
    error?: { message?: string };
  };
  if (!res.ok) {
    return { error: data.error?.message ?? `Meta API error ${res.status}` };
  }
  return { messageId: data.message_id };
}

export interface MetaMessagingEvent {
  senderId: string;
  recipientId?: string;
  messageId?: string;
  text?: string;
  platform: "facebook" | "instagram";
  senderName?: string;
}

export function parseMetaWebhook(body: unknown): MetaMessagingEvent[] {
  const events: MetaMessagingEvent[] = [];
  const payload = body as {
    object?: string;
    entry?: Array<{
      messaging?: Array<{
        sender?: { id?: string };
        recipient?: { id?: string };
        message?: { mid?: string; text?: string; is_echo?: boolean };
      }>;
    }>;
  };

  if (payload.object !== "page" && payload.object !== "instagram") return events;

  const platform = payload.object === "instagram" ? "instagram" : "facebook";

  for (const entry of payload.entry ?? []) {
    for (const item of entry.messaging ?? []) {
      if (item.message?.is_echo) continue;
      const text = item.message?.text?.trim();
      const senderId = item.sender?.id;
      if (!senderId || !text) continue;
      events.push({
        senderId,
        recipientId: item.recipient?.id,
        messageId: item.message?.mid,
        text,
        platform,
      });
    }
  }

  return events;
}
