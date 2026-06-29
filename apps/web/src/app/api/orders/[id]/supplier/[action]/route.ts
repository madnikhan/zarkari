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

interface Props {
  params: Promise<{ id: string; action: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || session.role !== "supplier") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, action } = await params;
  const order = await getBridalOrderById(id);
  if (!order || order.supplierId !== session.supplierId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  switch (action) {
    case "accept":
      await supplierAccept(id, session.name);
      break;
    case "reject":
      await supplierReject(id, body.comment ?? "Rejected", session.name);
      break;
    case "advance":
      await advanceProductionStage(id, body.stage as BridalStatus, session.name);
      break;
    case "complete":
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

  const updated = await getBridalOrderById(id);
  const [timeline, files] = await Promise.all([
    getTimeline(id),
    getOrderFiles(id, !!updated?.filesUnlockedAt),
  ]);

  return NextResponse.json({ order: updated, timeline, files });
}
