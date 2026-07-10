import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listStockOverviewDb } from "@/lib/db/cms-products";

export async function GET() {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { products } = await listStockOverviewDb({ limit: 500 });
  return NextResponse.json({ products });
}
