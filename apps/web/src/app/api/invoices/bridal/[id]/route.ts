import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getBridalOrderById, getCustomer, getPayments } from "@/lib/data";
import { bridalOrderToInvoice } from "@/lib/invoices/build-invoice-data";
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
    if (!token || !(await verifyInvoiceToken(token, "bridal", id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const order = await getBridalOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [customer, payments] = await Promise.all([getCustomer(order.customerId), getPayments(id)]);
  const data = bridalOrderToInvoice(order, customer?.name ?? "Customer", customer?.phone);
  const methods = payments.map((p) => (p.method ?? "").toLowerCase());
  data.paymentCash = methods.some((m) => m.includes("cash"));
  data.paymentOnline = methods.some(
    (m) => m.includes("card") || m.includes("online") || m.includes("stripe") || m.includes("bank")
  );
  if (!data.paymentCash && !data.paymentOnline && parseFloat(order.depositPaid || "0") > 0) {
    data.paymentOnline = true;
  }

  const html = renderStoreInvoiceHtml(data);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
