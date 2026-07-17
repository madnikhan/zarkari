import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { deleteCargoBoxItem, getCargoBox, updateCargoBoxItem } from "@/lib/cargo/service";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boxId, itemId } = await params;
  const box = await getCargoBox(boxId);
  if (!box) return NextResponse.json({ error: "Box not found" }, { status: 404 });

  const body = await request.json();
  const item = await updateCargoBoxItem(itemId, {
    itemDate: body.itemDate,
    articleName: body.articleName,
    bridalOrderId: body.bridalOrderId ?? null,
    orderNumber: body.orderNumber,
    costPkr: body.costPkr,
    costGbp: body.costGbp,
    exchangeRate: body.exchangeRate,
    imageUrl: body.imageUrl,
    imageKey: body.imageKey,
  });

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  revalidatePath("/admin/cargo");
  return NextResponse.json({ item });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boxId, itemId } = await params;
  const box = await getCargoBox(boxId);
  if (!box) return NextResponse.json({ error: "Box not found" }, { status: 404 });
  if (box.khataEntryId) {
    return NextResponse.json(
      { error: "Cannot remove items from a box posted to khata" },
      { status: 400 }
    );
  }
  await deleteCargoBoxItem(itemId);
  revalidatePath("/admin/cargo");
  return NextResponse.json({ ok: true });
}
