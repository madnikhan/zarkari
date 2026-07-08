import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { deleteCargoBox, getCargoBox, updateCargoBox } from "@/lib/cargo/service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const box = await getCargoBox(id);
  if (!box) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ box });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  const box = await updateCargoBox(id, {
    cargoCompanyId: body.cargoCompanyId,
    trackingNumber: body.trackingNumber,
    supplierId: body.supplierId,
    receivedDate: body.receivedDate,
    weightKg: body.weightKg,
    notes: body.notes,
    exchangeRate: body.exchangeRate,
  });
  if (!box) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidatePath("/admin/cargo");
  return NextResponse.json({ box });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const box = await getCargoBox(id);
  if (!box) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (box.khataEntryId) {
    return NextResponse.json(
      { error: "Cannot delete a box that has been posted to khata" },
      { status: 400 }
    );
  }
  await deleteCargoBox(id);
  revalidatePath("/admin/cargo");
  return NextResponse.json({ ok: true });
}
