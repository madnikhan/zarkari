import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { getBridalOrderById, getOrderFiles } from "@/lib/data";
import { addOrderFile } from "@/lib/data/actions";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_CATEGORIES = new Set(["design", "measurements", "voice"]);

export async function POST(request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getBridalOrderById(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  try {
    const body = await request.json();
    const files = Array.isArray(body.files) ? body.files : [];
    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    for (const file of files) {
      const url = typeof file.url === "string" ? file.url.trim() : "";
      const name = typeof file.name === "string" ? file.name.trim() : "";
      if (!url || !name) {
        return NextResponse.json({ error: "Each file needs url and name" }, { status: 400 });
      }
      const category =
        typeof file.category === "string" && ALLOWED_CATEGORIES.has(file.category)
          ? file.category
          : "design";
      await addOrderFile(id, category, name, url);
    }

    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");

    const updated = await getOrderFiles(id, true);
    return NextResponse.json({ ok: true, files: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to attach files";
    console.error("[orders/files POST]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
