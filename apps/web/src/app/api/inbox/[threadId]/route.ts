import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import {
  deleteSocialThread,
  getSocialMessages,
  getSocialThread,
  updateSocialThread,
} from "@/lib/social-inbox/service";
import type { SocialThreadStatus } from "@/lib/social-inbox/types";

interface RouteParams {
  params: Promise<{ threadId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { threadId } = await params;
  const thread = await getSocialThread(threadId);
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await getSocialMessages(threadId);
  await updateSocialThread(threadId, { markRead: true });

  return NextResponse.json({ thread: { ...thread, unreadCount: 0 }, messages });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { threadId } = await params;
  const body = (await request.json()) as {
    status?: SocialThreadStatus;
    markRead?: boolean;
  };

  const thread = await updateSocialThread(threadId, body);
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ thread });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const thread = await getSocialThread(threadId);
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await deleteSocialThread(threadId);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  revalidatePath("/admin/inbox");
  return NextResponse.json({ ok: true });
}
