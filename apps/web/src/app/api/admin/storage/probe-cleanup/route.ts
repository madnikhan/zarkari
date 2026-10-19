import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { deleteFromR2, isR2Configured } from "@/lib/r2";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const key = String(body.key ?? "");
  if (!key.startsWith("uploads/_probe/")) {
    return NextResponse.json({ error: "Invalid probe key" }, { status: 400 });
  }

  if (!isR2Configured()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await deleteFromR2(key);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Probe cleanup failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cleanup failed" },
      { status: 500 }
    );
  }
}
