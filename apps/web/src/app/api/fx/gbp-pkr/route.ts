import { NextResponse } from "next/server";
import { getGbpPkrRate } from "@/lib/fx/gbp-pkr";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rate = await getGbpPkrRate();
  return NextResponse.json({ rate, from: "GBP", to: "PKR", cached: true });
}
