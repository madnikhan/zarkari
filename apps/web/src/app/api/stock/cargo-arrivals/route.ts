import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listCargoArrivalsDb } from "@/lib/db/cargo-boxes";
import { demoCargoBoxItems, demoCargoBoxes } from "@/lib/cargo/demo-store";
import { isDbConfigured } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const kind = params.get("kind") === "custom" ? "custom" : "sample";
  const q = params.get("q") ?? undefined;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") ?? "50", 10) || 50));
  const offset = Math.max(0, parseInt(params.get("offset") ?? "0", 10) || 0);

  if (isDbConfigured()) {
    const result = await listCargoArrivalsDb({ kind, q, from, to, limit, offset });
    return NextResponse.json(result);
  }

  // Demo fallback
  let items = demoCargoBoxItems
    .filter((i) => (i.itemKind ?? (i.bridalOrderId ? "custom" : "sample")) === kind)
    .map((i) => {
      const box = demoCargoBoxes.find((b) => b.id === i.boxId);
      return {
        id: i.id,
        itemDate: i.itemDate,
        articleName: i.articleName,
        itemKind: i.itemKind ?? (i.bridalOrderId ? "custom" : "sample"),
        imageUrl: i.imageUrl,
        costPkr: i.costPkr,
        costGbp: i.costGbp,
        boxId: i.boxId,
        boxNumber: box?.boxNumber ?? "—",
        supplierName: box?.supplierName,
        cargoCompanyName: box?.cargoCompanyName,
        bridalOrderId: i.bridalOrderId,
        orderNumber: i.orderNumber,
        orderStatus: undefined as string | undefined,
      };
    });
  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    items = items.filter(
      (i) =>
        i.articleName.toLowerCase().includes(needle) ||
        i.boxNumber.toLowerCase().includes(needle) ||
        (i.orderNumber?.toLowerCase().includes(needle) ?? false)
    );
  }
  const total = items.length;
  return NextResponse.json({ items: items.slice(offset, offset + limit), total });
}
