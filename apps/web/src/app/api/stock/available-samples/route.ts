import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listAvailableSamples } from "@/lib/cargo/service";

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const samples = await listAvailableSamples();
  return NextResponse.json({ samples });
}
