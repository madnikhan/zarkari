import { NextResponse } from "next/server";
import {
  getWhatsAppVerifyToken,
  parseWhatsAppWebhook,
  verifyWhatsAppSignature,
} from "@/lib/social-inbox/whatsapp-client";
import { recordInboundMessage } from "@/lib/social-inbox/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === getWhatsAppVerifyToken() && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (process.env.NODE_ENV === "production" && getWhatsAppVerifyToken()) {
    if (!verifyWhatsAppSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  for (const msg of parseWhatsAppWebhook(body)) {
    await recordInboundMessage({
      platform: "whatsapp",
      externalThreadId: msg.from,
      externalMessageId: msg.messageId,
      contactName: msg.contactName,
      contactPhone: msg.from,
      body: msg.text,
    });
  }

  return NextResponse.json({ ok: true });
}
