import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { getCargoBox, postBoxToKhata } from "@/lib/cargo/service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await getSession();
  if (!session || !["owner", "staff"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const box = await postBoxToKhata(id);
    revalidatePath("/admin/cargo");
    revalidatePath("/admin/suppliers/payments");
    if (box?.supplierId) revalidatePath(`/admin/suppliers/${box.supplierId}/khata`);
    return NextResponse.json({ box });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not post to khata" },
      { status: 400 }
    );
  }
}
