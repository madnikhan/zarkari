import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { getShopSettings } from "@/lib/data";
import { demoShopSettings } from "@/lib/data/seed";
import { isDbConfigured } from "@/lib/db";
import { setShopSettingsDb } from "@/lib/db/shop-settings";

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
    if (typeof value === "string") {
      demoShopSettings[key] = value;
      updates[key] = value;
    }
  }

  if (isDbConfigured() && Object.keys(updates).length) {
    await setShopSettingsDb(updates);
  }

  revalidatePath("/");
  return NextResponse.json({ settings: { ...demoShopSettings, ...updates } });
}
