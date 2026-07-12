import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { buildInvoiceShareUrl, type InvoiceKind } from "@/lib/invoices/invoice-token";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") as InvoiceKind | null;
  const id = searchParams.get("id");
  if (!id || (kind !== "retail" && kind !== "bridal")) {
    return NextResponse.json({ error: "kind and id required" }, { status: 400 });
  }

  const url = await buildInvoiceShareUrl(kind, id);
  return NextResponse.json({ url });
}
