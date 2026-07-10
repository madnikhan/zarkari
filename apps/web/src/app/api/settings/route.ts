import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { getShopSettings } from "@/lib/data";
import { filterHeroMediaClips, isHeroMediaUrl, type HeroVideoClip } from "@/lib/data/hero-videos";
import { demoShopSettings } from "@/lib/data/seed";
import { isDbConfigured } from "@/lib/db";
import { setShopSettingsDb } from "@/lib/db/shop-settings";

function validateHeroVideosJson(raw: string): { ok: true; value: string } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return { ok: false, error: "heroVideos must be a JSON array" };
    }
    const clips: HeroVideoClip[] = [];
    for (const item of parsed) {
      const url = typeof (item as { url?: unknown })?.url === "string" ? (item as { url: string }).url.trim() : "";
      if (!url) continue;
      if (!isHeroMediaUrl(url)) {
        return {
          ok: false,
          error: "Hero videos must be stored in the hero folder (uploads/hero/). Upload via Hero Media.",
        };
      }
      const poster =
        typeof (item as { poster?: unknown })?.poster === "string"
          ? (item as { poster: string }).poster.trim()
          : undefined;
      clips.push(poster ? { url, poster } : { url });
    }
    return { ok: true, value: JSON.stringify(filterHeroMediaClips(clips)) };
  } catch {
    return { ok: false, error: "heroVideos must be valid JSON" };
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await getShopSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (session?.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }
  const body = (await request.json()) as Record<string, string>;
  const updates: Record<string, string> = {};

  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== "string") continue;

    if (key === "heroVideos") {
      const result = validateHeroVideosJson(value);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      demoShopSettings[key] = result.value;
      updates[key] = result.value;
      continue;
    }

    demoShopSettings[key] = value;
    updates[key] = value;
  }

  if (isDbConfigured() && Object.keys(updates).length) {
    await setShopSettingsDb(updates);
  }

  revalidatePath("/");
  return NextResponse.json({ settings: { ...demoShopSettings, ...updates } });
}
