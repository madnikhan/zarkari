import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { isUuid } from "@/lib/db";
import { createCargoBox, listCargoBoxes } from "@/lib/cargo/service";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = new URL(request.url).searchParams.get("q") ?? undefined;
  const boxes = await listCargoBoxes(q);
  return NextResponse.json({ boxes, total: boxes.length });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.cargoCompanyId || !body.trackingNumber || !body.supplierId || !body.receivedDate) {
      return NextResponse.json(
        { error: "cargoCompanyId, trackingNumber, supplierId, and receivedDate required" },
        { status: 400 }
      );
    }
    if (!isUuid(body.cargoCompanyId) || !isUuid(body.supplierId)) {
      return NextResponse.json({ error: "Invalid cargo company or supplier" }, { status: 400 });
    }

    const box = await createCargoBox({
      cargoCompanyId: body.cargoCompanyId,
      trackingNumber: body.trackingNumber,
      supplierId: body.supplierId,
      receivedDate: body.receivedDate,
      weightKg: body.weightKg,
      notes: body.notes,
      exchangeRate: body.exchangeRate,
      createdByUserId: isUuid(session.id) ? session.id : undefined,
      postToKhata: Boolean(body.postToKhata),
    });

    if (!box) {
      return NextResponse.json(
        { error: "Failed to create box — database unavailable" },
        { status: 500 }
      );
    }

    revalidatePath("/admin/cargo");
    return NextResponse.json({ box }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create box";
    console.error("[cargo/boxes POST]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
