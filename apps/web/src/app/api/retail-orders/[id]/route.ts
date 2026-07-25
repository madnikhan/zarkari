import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { canDeleteRecords, getSession } from "@/lib/auth/session";
import {
  deleteRetailOrderDb,
  getRetailOrderByIdDb,
  getRetailOrderStatusDb,
  updateRetailOrderCustomerDb,
} from "@/lib/db/retail-orders";
import { restoreForCancelledOrder } from "@/lib/stock/service";
import { updateRetailOrderStatus } from "@/lib/data/products";
import { demoRetailOrders } from "@/lib/data/seed";
import { isDbConfigured } from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    status?: string;
    customerName?: string | null;
    customerPhone?: string | null;
    customerEmail?: string | null;
  };

  const hasCustomerPatch =
    body.customerName !== undefined ||
    body.customerPhone !== undefined ||
    body.customerEmail !== undefined;

  if (hasCustomerPatch) {
    const name =
      body.customerName === null
        ? null
        : typeof body.customerName === "string"
          ? body.customerName.trim() || null
          : undefined;
    const phone =
      body.customerPhone === null
        ? null
        : typeof body.customerPhone === "string"
          ? body.customerPhone.trim() || null
          : undefined;
    const email =
      body.customerEmail === null
        ? null
        : typeof body.customerEmail === "string"
          ? body.customerEmail.trim() || null
          : undefined;

    if (isDbConfigured()) {
      const order = await updateRetailOrderCustomerDb(id, {
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
      });
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      revalidatePath(`/admin/orders/shop/${id}`);
      revalidatePath("/admin/orders");
      if (body.status === undefined) return NextResponse.json({ order });
    } else {
      const order = demoRetailOrders.find((o) => o.id === id);
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      if (name !== undefined) order.customerName = name ?? undefined;
      if (phone !== undefined) order.customerPhone = phone ?? undefined;
      if (email !== undefined) order.customerEmail = email ?? undefined;
      revalidatePath(`/admin/orders/shop/${id}`);
      revalidatePath("/admin/orders");
      if (body.status === undefined) return NextResponse.json({ order });
    }
  }

  if (!body.status && !hasCustomerPatch) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  if (!body.status) {
    const order = isDbConfigured()
      ? await getRetailOrderByIdDb(id)
      : (demoRetailOrders.find((o) => o.id === id) ?? null);
    return NextResponse.json({ order });
  }

  const previousStatus = await getRetailOrderStatusDb(id);

  const ok = await updateRetailOrderStatus(id, body.status);
  if (!ok) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (body.status === "cancelled" && previousStatus !== "cancelled") {
    await restoreForCancelledOrder(id, session.id).catch(console.error);
  }

  revalidatePath(`/admin/orders/shop/${id}`);
  revalidatePath("/admin/orders");
  return NextResponse.json({ ok: true });
}

export async function GET(_request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getRetailOrderByIdDb(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ order });
}

export async function DELETE(_request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || !canDeleteRecords(session.role)) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { id } = await params;
  const order = isDbConfigured()
    ? await getRetailOrderByIdDb(id)
    : (demoRetailOrders.find((o) => o.id === id) ?? null);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (order.status !== "cancelled") {
    return NextResponse.json(
      { error: "Cancel the order before deleting it." },
      { status: 400 }
    );
  }

  if (isDbConfigured()) {
    const ok = await deleteRetailOrderDb(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  } else {
    const idx = demoRetailOrders.findIndex((o) => o.id === id);
    if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    demoRetailOrders.splice(idx, 1);
  }

  revalidatePath("/admin/orders");
  return NextResponse.json({ ok: true });
}
