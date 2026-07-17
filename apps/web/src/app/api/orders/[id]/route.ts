import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getBridalOrderById, getCustomer, getOrderFiles, getPendingSupplierUpdates, getSupplierMessages, getTimeline } from "@/lib/data";
import { editBridalOrder } from "@/lib/data/actions";
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
  const [timeline, files, supplierMessages, pendingUpdates] = await Promise.all([
    getTimeline(order.id),
    getOrderFiles(order.id, filesUnlocked),
    getSupplierMessages(order.id),
    session.role !== "supplier" ? getPendingSupplierUpdates(order.id) : Promise.resolve([]),
  ]);

  const safeOrder =
    session.role === "supplier"
      ? {
          ...order,
          totalPrice: "0",
          depositPaid: "0",
          remainingBalance: "0",
        }
      : order;

  if (session.role === "supplier") {
    void import("@/lib/firebase/sync")
      .then(async (m) => {
        await m.syncOrderLive(order.id, { status: order.status, deliveryDate: order.deliveryDate });
        for (const msg of supplierMessages) {
          await m.syncSupplierOrderMessage(order.id, msg);
        }
      })
      .catch(console.error);
  }

  return NextResponse.json({
    order: safeOrder,
    customerName: customer?.name,
    timeline,
    files,
    supplierMessages,
    pendingUpdates,
  });
}

export async function PATCH(request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getBridalOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  try {
    const updated = await editBridalOrder(id, {
      dressType: body.dressType,
      customisationNotes: body.customisationNotes,
      deliveryDate: body.deliveryDate,
      totalPrice: body.totalPrice,
      depositPaid: body.depositPaid,
      measurements: body.measurements,
      extraCharge: body.extraCharge,
      performedByName: session.name,
    });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");
    return NextResponse.json({ order: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
