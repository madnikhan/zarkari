import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listStockMovementsDb } from "@/lib/db/cms-products";

interface Props {
  params: Promise<{ productId: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;
  const movements = await listStockMovementsDb(productId);
  return NextResponse.json({ movements });
}
