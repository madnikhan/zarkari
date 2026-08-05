import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { deleteCargoBoxItem, getCargoBox, updateCargoBoxItem } from "@/lib/cargo/service";
import { markReadyFromCargoArrival } from "@/lib/data/actions";

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
  const itemKind: "custom" | "sample" | undefined =
    body.itemKind === "custom" || body.itemKind === "sample"
      ? body.itemKind
      : body.bridalOrderId
        ? "custom"
        : body.bridalOrderId === null
          ? "sample"
          : undefined;

  if (itemKind === "custom" && !body.bridalOrderId) {
    return NextResponse.json({ error: "Select an open custom order" }, { status: 400 });
  }

  const item = await updateCargoBoxItem(itemId, {
    itemDate: body.itemDate,
    articleName: body.articleName,
    itemKind,
    bridalOrderId:
      itemKind === "sample" ? null : body.bridalOrderId !== undefined ? body.bridalOrderId : undefined,
    orderNumber: body.orderNumber,
    costPkr: body.costPkr,
    costGbp: body.costGbp,
    exchangeRate: body.exchangeRate,
    imageUrl: body.imageUrl,
    imageKey: body.imageKey,
  });

  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  if (item.itemKind === "custom" && item.bridalOrderId) {
    try {
      await markReadyFromCargoArrival(item.bridalOrderId, {
        byName: session.name,
        boxNumber: box.boxNumber,
      });
      revalidatePath(`/admin/orders/${item.bridalOrderId}`);
      revalidatePath("/my-order");
    } catch (err) {
      console.error("Failed to sync order status from cargo:", err);
    }
  }

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
