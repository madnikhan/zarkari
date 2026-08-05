import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { addCargoBoxItem, getCargoBox } from "@/lib/cargo/service";
import { markReadyFromCargoArrival } from "@/lib/data/actions";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: boxId } = await params;
  const box = await getCargoBox(boxId);
  if (!box) return NextResponse.json({ error: "Box not found" }, { status: 404 });

  const body = await request.json();
  if (!body.articleName?.trim() || !body.itemDate) {
    return NextResponse.json({ error: "articleName and itemDate required" }, { status: 400 });
  }

  const itemKind: "custom" | "sample" =
    body.itemKind === "custom" || body.bridalOrderId ? "custom" : "sample";

  if (itemKind === "custom" && !body.bridalOrderId) {
    return NextResponse.json({ error: "Select an open custom order" }, { status: 400 });
  }

  const item = await addCargoBoxItem({
    boxId,
    itemDate: body.itemDate,
    articleName: body.articleName,
    itemKind,
    bridalOrderId: itemKind === "custom" ? body.bridalOrderId : undefined,
    orderNumber: itemKind === "custom" ? body.orderNumber : undefined,
    costPkr: body.costPkr ?? "0",
    costGbp: body.costGbp ?? "0",
    exchangeRate: body.exchangeRate,
    imageUrl: body.imageUrl,
    imageKey: body.imageKey,
  });

  if (!item) return NextResponse.json({ error: "Failed to add item" }, { status: 500 });

  if (itemKind === "custom" && item.bridalOrderId) {
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
  return NextResponse.json({ item }, { status: 201 });
}
