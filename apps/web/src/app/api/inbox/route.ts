import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listSocialThreads } from "@/lib/social-inbox/service";
import type { SocialPlatform, SocialThreadStatus } from "@/lib/social-inbox/types";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff", "supplier"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const platform = url.searchParams.get("platform") as SocialPlatform | null;
  const unreadOnly = url.searchParams.get("unread") === "1";
  const status = url.searchParams.get("status") as SocialThreadStatus | null;

  const threads = await listSocialThreads({
    platform: platform ?? undefined,
    unreadOnly,
    status: status ?? undefined,
  });

  return NextResponse.json({ threads });
}
