import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  addOutboundMessage,
  getSocialThread,
} from "@/lib/social-inbox/service";
import { sendMetaMessage } from "@/lib/social-inbox/meta-client";
import { sendWhatsAppMessage } from "@/lib/social-inbox/whatsapp-client";
import { isManualPlatform } from "@/lib/social-inbox/types";

interface RouteParams {
  params: Promise<{ threadId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { threadId } = await params;
  const thread = await getSocialThread(threadId);
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { body: text } = (await request.json()) as { body?: string };
  if (!text?.trim()) {
    return NextResponse.json({ error: "Message body required" }, { status: 400 });
  }

  let externalMessageId: string | undefined;
  let apiError: string | undefined;

  if (
    (thread.platform === "facebook" || thread.platform === "instagram") &&
    thread.externalThreadId
  ) {
    const result = await sendMetaMessage(thread.externalThreadId, text.trim());
    if (result.error) apiError = result.error;
    else externalMessageId = result.messageId;
  } else if (thread.platform === "whatsapp" && thread.externalThreadId) {
    const result = await sendWhatsAppMessage(thread.externalThreadId, text.trim());
    if (result.error) apiError = result.error;
    else externalMessageId = result.messageId;
  } else if (!isManualPlatform(thread.platform)) {
    return NextResponse.json(
      { error: "Cannot send reply for this thread (missing external ID)" },
      { status: 400 }
    );
  }

  const message = await addOutboundMessage({
    threadId,
    body: text.trim(),
    sentByUserId: session.id,
    externalMessageId,
    status: "replied",
  });

  if (!message) {
    return NextResponse.json({ error: "Failed to save reply" }, { status: 500 });
  }

  return NextResponse.json({
    message,
    apiError,
    note:
      isManualPlatform(thread.platform) || apiError
        ? apiError
          ? "Reply saved locally; API send failed — respond in the native app if needed."
          : "Reply logged — send manually on the native platform if needed."
        : undefined,
  });
}
