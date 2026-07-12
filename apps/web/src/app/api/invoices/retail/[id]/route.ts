import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getRetailOrderByIdDb } from "@/lib/db/retail-orders";
import { retailOrderToInvoice } from "@/lib/invoices/build-invoice-data";
import { renderStoreInvoiceHtml } from "@/lib/invoices/store-invoice-html";
import { verifyInvoiceToken } from "@/lib/invoices/invoice-token";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("t");
  const session = await getSession();
  const isStaff = session?.role === "owner" || session?.role === "staff";

  if (!isStaff) {
    if (!token || !(await verifyInvoiceToken(token, "retail", id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const order = await getRetailOrderByIdDb(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const html = renderStoreInvoiceHtml(retailOrderToInvoice(order));
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
