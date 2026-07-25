import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { canDeleteRecords, getSession } from "@/lib/auth/session";
import { isDbConfigured } from "@/lib/db";
import {
  customerHasBlockingOrdersDb,
  deleteCustomerDb,
  getCustomerDb,
  updateCustomerDb,
} from "@/lib/db/bridal-orders";
import { demoBridalOrders, demoCustomers } from "@/lib/data/seed";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined;
  const email =
    body.email === null
      ? null
      : typeof body.email === "string"
        ? body.email.trim() || null
        : undefined;
  const address =
    body.address === null
      ? null
      : typeof body.address === "string"
        ? body.address.trim() || null
        : undefined;

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (phone !== undefined && !phone) {
    return NextResponse.json({ error: "Phone is required" }, { status: 400 });
  }

  if (isDbConfigured()) {
    const customer = await updateCustomerDb(id, { name, phone, email, address });
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidatePath("/admin/customers");
    return NextResponse.json({ customer });
  }

  const customer = demoCustomers.find((c) => c.id === id);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (name !== undefined) customer.name = name;
  if (phone !== undefined) customer.phone = phone;
  if (email !== undefined) customer.email = email ?? undefined;
  if (address !== undefined) customer.address = address ?? undefined;
  revalidatePath("/admin/customers");
  return NextResponse.json({ customer });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !canDeleteRecords(session.role)) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { id } = await params;

  if (isDbConfigured()) {
    const existing = await getCustomerDb(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const block = await customerHasBlockingOrdersDb(id);
    if (block.blocked) {
      return NextResponse.json({ error: block.reason ?? "Cannot delete customer" }, { status: 409 });
    }

    const ok = await deleteCustomerDb(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidatePath("/admin/customers");
    return NextResponse.json({ ok: true });
  }

  const idx = demoCustomers.findIndex((c) => c.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const hasActiveBridal = demoBridalOrders.some(
    (o) => o.customerId === id && o.status !== "cancelled" && o.status !== "refunded"
  );
  if (hasActiveBridal) {
    return NextResponse.json(
      { error: "Customer has bridal orders that are not cancelled or refunded" },
      { status: 409 }
    );
  }

  demoCustomers.splice(idx, 1);
  revalidatePath("/admin/customers");
  return NextResponse.json({ ok: true });
}
