import { NextResponse } from "next/server";
import { getBridalOrderById, getCustomer, getOrderFiles, getTimeline } from "@/lib/data";
import { getSession } from "@/lib/auth/session";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await getBridalOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.role === "supplier" && order.supplierId !== session.supplierId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customer = await getCustomer(order.customerId);
  const filesUnlocked = session.role === "supplier" ? !!order.filesUnlockedAt : true;
  const [timeline, files] = await Promise.all([
    getTimeline(order.id),
    getOrderFiles(order.id, filesUnlocked),
  ]);

  return NextResponse.json({
    order,
    customerName: customer?.name,
    timeline,
    files,
  });
}
