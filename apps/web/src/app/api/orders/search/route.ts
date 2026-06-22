import { NextResponse } from "next/server";
import { searchOrders, getCustomer } from "@/lib/data";
import { getSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const orders = await searchOrders(q);
  const results = await Promise.all(
    orders.map(async (o) => ({
      ...o,
      customerName: (await getCustomer(o.customerId))?.name,
    }))
  );

  return NextResponse.json({ results });
}
