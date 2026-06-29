import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSuppliers } from "@/lib/data";

export async function GET() {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const suppliers = await getSuppliers();
  return NextResponse.json({ suppliers });
}
