import { NextResponse } from "next/server";
import {
  supplierAccept,
  supplierReject,
  advanceProductionStage,
  supplierComplete,
} from "@/lib/data/actions";
import { getBridalOrderById, getOrderFiles, getTimeline } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import type { BridalStatus } from "@/lib/data/seed";
import { PRODUCTION_STAGES } from "@/lib/orders/status-machine";

interface Props {
  params: Promise<{ id: string; action: string }>;
}

function getNextProductionStage(status: BridalStatus): BridalStatus | null {
  const idx = PRODUCTION_STAGES.indexOf(status);
  if (idx >= 0 && idx < PRODUCTION_STAGES.length - 1) {
    return PRODUCTION_STAGES[idx + 1]!;
  }
  if (status === "redesign_in_progress") return "embroidery";
  return null;
}

export async function POST(request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "supplier" || !session.supplierId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, action } = await params;
  const order = await getBridalOrderById(id);
  if (!order || order.supplierId !== session.supplierId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    switch (action) {
      case "accept":
        if (order.status !== "sent_to_supplier") {
          return NextResponse.json({ error: "Order cannot be accepted in current status" }, { status: 400 });
        }
        await supplierAccept(id, session.name);
        break;
      case "reject":
        if (order.status !== "sent_to_supplier") {
          return NextResponse.json({ error: "Order cannot be rejected in current status" }, { status: 400 });
        }
        await supplierReject(id, body.comment ?? "Rejected", session.name);
        break;
      case "advance": {
        if (order.supplierLocked) {
          return NextResponse.json({ error: "Order is locked" }, { status: 400 });
        }
        const requestedStage = body.stage as BridalStatus;
        const nextStage = getNextProductionStage(order.status);
        if (!nextStage || requestedStage !== nextStage) {
          return NextResponse.json({ error: `Can only advance to next stage: ${nextStage ?? "none"}` }, { status: 400 });
        }
        await advanceProductionStage(id, requestedStage, session.name);
        break;
      }
      case "complete":
        if (order.supplierLocked) {
          return NextResponse.json({ error: "Order is locked" }, { status: 400 });
        }
        if (order.status !== "delivered_to_shop" && order.status !== "shipping") {
          return NextResponse.json({ error: "Order is not ready to complete" }, { status: 400 });
        }
        if (!body.billNumber) return NextResponse.json({ error: "Bill number required" }, { status: 400 });
        await supplierComplete(
          id,
          {
            deliveryDate: body.deliveryDate ?? new Date().toISOString(),
            billNumber: body.billNumber,
            courierName: body.courierName,
            trackingNumber: body.trackingNumber,
            photoUrl: body.photoUrl,
          },
          session.name
        );
        break;
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 404 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const updated = await getBridalOrderById(id);
  const [timeline, files] = await Promise.all([
    getTimeline(id),
    getOrderFiles(id, !!updated?.filesUnlockedAt),
  ]);

  return NextResponse.json({ order: updated, timeline, files });
}
