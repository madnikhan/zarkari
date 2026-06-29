import { NextResponse } from "next/server";
import { parseMetaWebhook, verifyMetaSignature } from "@/lib/social-inbox/meta-client";
import { recordInboundMessage } from "@/lib/social-inbox/service";

function getMetaVerifyToken(): string {
  return process.env.META_VERIFY_TOKEN?.trim() || "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === getMetaVerifyToken() && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (process.env.NODE_ENV === "production" && getMetaVerifyToken()) {
    if (!verifyMetaSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  for (const event of parseMetaWebhook(body)) {
    await recordInboundMessage({
      platform: event.platform,
      externalThreadId: event.senderId,
      externalMessageId: event.messageId,
      contactName: event.senderName,
      body: event.text!,
    });
  }

  return NextResponse.json({ ok: true });
}
