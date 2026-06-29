import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createManualInquiry } from "@/lib/social-inbox/service";
import { MANUAL_PLATFORMS, type SocialPlatform } from "@/lib/social-inbox/types";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    platform?: SocialPlatform;
    contactName?: string;
    contactHandle?: string;
    contactPhone?: string;
    subject?: string;
    message?: string;
    sourceUrl?: string;
  };

  const platform = body.platform;
  if (!platform || !MANUAL_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }
  if (!body.message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const metadata = body.sourceUrl ? { sourceUrl: body.sourceUrl } : undefined;
  const result = await createManualInquiry({
    platform,
    contactName: body.contactName?.trim(),
    contactHandle: body.contactHandle?.trim(),
    contactPhone: body.contactPhone?.trim(),
    subject: body.subject?.trim(),
    body: body.message.trim(),
    metadata,
    createdByUserId: session.id,
  });

  if (!result) {
    return NextResponse.json({ error: "Failed to create inquiry" }, { status: 500 });
  }

  return NextResponse.json(result, { status: 201 });
}
