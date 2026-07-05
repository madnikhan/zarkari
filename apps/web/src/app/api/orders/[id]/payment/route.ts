import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { recordPayment } from "@/lib/data/actions";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const session = await getSession();
  if (!session || (session.role !== "owner" && session.role !== "staff")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    type?: string;
    amount?: string;
    method?: string;
    businessDate?: string;
    description?: string;
  };
  if (!body.type || !body.amount) {
    return NextResponse.json({ error: "Type and amount required" }, { status: 400 });
  }

  await recordPayment(id, {
    type: body.type,
    amount: body.amount,
    method: body.method,
    businessDate: body.businessDate,
    description: body.description,
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/finance");
  revalidatePath("/admin/cash");
  revalidatePath("/admin/cash/analytics");
  revalidatePath(`/admin/orders/${id}`);

  return NextResponse.json({ ok: true });
}
