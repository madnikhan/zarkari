import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { updateRetailOrderStatus } from "@/lib/data/products";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = (await request.json()) as { status?: string };
  if (!status) return NextResponse.json({ error: "Status required" }, { status: 400 });

  const ok = await updateRetailOrderStatus(id, status);
  if (!ok) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
