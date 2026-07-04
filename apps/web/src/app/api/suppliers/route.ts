import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isDbConfigured } from "@/lib/db";
import { createSupplierDb, listSuppliersDb } from "@/lib/db/bridal-orders";
import { demoSuppliers } from "@/lib/data/seed";

export async function GET() {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isDbConfigured()) {
    const includeInactive = session.role === "owner";
    const suppliers = await listSuppliersDb(includeInactive);
    return NextResponse.json({ suppliers });
  }
  return NextResponse.json({ suppliers: demoSuppliers });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  if (isDbConfigured()) {
    const supplier = await createSupplierDb({
      name: body.name.trim(),
      email: body.email?.trim(),
      phone: body.phone?.trim(),
      active: body.active !== false,
    });
    if (!supplier) return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
    return NextResponse.json({ supplier }, { status: 201 });
  }

  const supplier = {
    id: `sup-${Date.now()}`,
    name: body.name.trim(),
    email: body.email,
    phone: body.phone,
  };
  demoSuppliers.push(supplier);
  return NextResponse.json({ supplier }, { status: 201 });
}
