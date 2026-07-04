import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDbConfigured } from "@/lib/db";
import { deleteSupplierDb, updateSupplierDb } from "@/lib/db/bridal-orders";
import { demoSuppliers } from "@/lib/data/seed";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (session?.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  if (isDbConfigured()) {
    const supplier = await updateSupplierDb(id, {
      name: body.name?.trim(),
      email: body.email?.trim(),
      phone: body.phone?.trim(),
      active: body.active,
    });
    if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ supplier });
  }

  const supplier = demoSuppliers.find((s) => s.id === id);
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (body.name) supplier.name = body.name;
  if (body.email !== undefined) supplier.email = body.email;
  if (body.phone !== undefined) supplier.phone = body.phone;
  return NextResponse.json({ supplier });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (session?.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  if (isDbConfigured()) {
    const result = await deleteSupplierDb(id);
    if (!result.ok) return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    return NextResponse.json({ ok: true, soft: result.soft });
  }

  const idx = demoSuppliers.findIndex((s) => s.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  demoSuppliers.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
