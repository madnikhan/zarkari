import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { searchOrdersWithCustomer } from "@/lib/data";
import { getSession } from "@/lib/auth/session";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const results = await searchOrdersWithCustomer(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("Order search failed:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
