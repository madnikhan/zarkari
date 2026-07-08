import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { addCargoBoxItem, getCargoBox } from "@/lib/cargo/service";

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

  const item = await addCargoBoxItem({
    boxId,
    itemDate: body.itemDate,
    articleName: body.articleName,
    bridalOrderId: body.bridalOrderId,
    orderNumber: body.orderNumber,
    costPkr: body.costPkr ?? "0",
    costGbp: body.costGbp ?? "0",
    exchangeRate: body.exchangeRate,
  });

  if (!item) return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  revalidatePath("/admin/cargo");
  return NextResponse.json({ item }, { status: 201 });
}
