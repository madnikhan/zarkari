import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getBridalOrderById, getCustomer, getOrderFiles, getPendingSupplierUpdates, getSupplierMessages, getTimeline } from "@/lib/data";
import { editBridalOrder } from "@/lib/data/actions";
import { canDeleteRecords, getSession } from "@/lib/auth/session";
import { isDbConfigured } from "@/lib/db";
import {
  canHardDeleteBridalOrder,
  deleteBridalOrderDb,
} from "@/lib/db/bridal-orders";
import {
  demoBridalOrders,
  demoCancellations,
  demoMessages,
  demoNotifications,
  demoOrderCollections,
  demoOrderFiles,
  demoPayments,
  demoRedesigns,
  demoRefunds,
  demoSupplierCompletions,
  demoTimeline,
} from "@/lib/data/seed";

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

export async function DELETE(_request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || !canDeleteRecords(session.role)) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { id } = await params;
  const order = await getBridalOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!canHardDeleteBridalOrder(order.status)) {
    return NextResponse.json(
      {
        error: "This order cannot be deleted in its current status.",
      },
      { status: 400 }
    );
  }

  if (isDbConfigured()) {
    const ok = await deleteBridalOrderDb(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  } else {
    const idx = demoBridalOrders.findIndex((o) => o.id === id);
    if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    demoBridalOrders.splice(idx, 1);
    const scrub = <T extends { orderId: string }>(arr: T[]) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].orderId === id) arr.splice(i, 1);
      }
    };
    scrub(demoTimeline);
    scrub(demoOrderFiles);
    scrub(demoMessages);
    scrub(demoRedesigns);
    scrub(demoCancellations);
    scrub(demoRefunds);
    scrub(demoPayments);
    scrub(demoOrderCollections);
    scrub(demoSupplierCompletions);
    for (let i = demoNotifications.length - 1; i >= 0; i--) {
      if (demoNotifications[i].orderId === id) demoNotifications.splice(i, 1);
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  return NextResponse.json({ ok: true });
}
