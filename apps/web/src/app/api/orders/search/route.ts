import { NextResponse } from "next/server";
import { searchOrdersWithCustomer } from "@/lib/data";
import { getSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const params = new URL(request.url).searchParams;
    const q = params.get("q") ?? "";
    const cargoOpen = params.get("cargoOpen") === "1";
    const results = await searchOrdersWithCustomer(q, { cargoOpen });
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Order search failed:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
