import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { dismissSupplierUpdate, forwardSupplierUpdate } from "@/lib/data/actions";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, messageId } = await params;
  const body = await request.json();
  const action = body.action as "forward" | "dismiss";
  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  try {
    if (action === "forward") {
      await forwardSupplierUpdate(id, messageId, session.name, body.customerNote?.trim());
    } else {
      await dismissSupplierUpdate(id, messageId);
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Action failed" },
      { status: 400 }
    );
  }

  revalidatePath(`/admin/orders/${id}`);
  return NextResponse.json({ ok: true });
}
