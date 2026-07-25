import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listStockMovementsDb } from "@/lib/db/cms-products";
import { resolveSearchDateBounds } from "@/lib/admin/date-range";

interface Props {
  params: Promise<{ productId: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;
  const sp = new URL(request.url).searchParams;
  const bounds = resolveSearchDateBounds({
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    preset: sp.get("preset") ?? undefined,
  });
  const movements = await listStockMovementsDb(productId, {
    from: bounds.from,
    to: bounds.to,
  });
  return NextResponse.json({ movements });
}
