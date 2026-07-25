import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { isDbConfigured } from "@/lib/db";
import { deleteNotificationDb } from "@/lib/db/notifications";
import { demoNotifications } from "@/lib/data/seed";
import { decrementStaffUnread, decrementSupplierUnread } from "@/lib/firebase/sync";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const isSupplier = session.role === "supplier" && !!session.supplierId;
  let wasUnread = false;

  if (isDbConfigured()) {
    const { getDb, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const db = getDb();
    if (db) {
      const [existing] = await db
        .select({ read: schema.notifications.read })
        .from(schema.notifications)
        .where(eq(schema.notifications.id, id))
        .limit(1);
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
      wasUnread = !existing.read;
    }
    const ok = await deleteNotificationDb(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  } else {
    const idx = demoNotifications.findIndex((n) => n.id === id);
    if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    wasUnread = !demoNotifications[idx].read;
    demoNotifications.splice(idx, 1);
  }

  if (wasUnread) {
    if (isSupplier && session.supplierId) decrementSupplierUnread(session.supplierId);
    else decrementStaffUnread();
  }

  revalidatePath("/admin/notifications");
  return NextResponse.json({ ok: true });
}
