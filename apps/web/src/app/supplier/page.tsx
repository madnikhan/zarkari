import { Suspense } from "react";
import { getBridalOrdersWithRelations, getSupplierTabCounts } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { SupplierHomeClient } from "@/components/supplier/SupplierHomeClient";

const PAGE_SIZE = 20;

type SupplierTab = "new" | "in-progress" | "completed" | "cancelled";

interface Props {
  searchParams?: Promise<{ tab?: string; page?: string; q?: string }>;
}

export default async function SupplierHomePage({ searchParams }: Props) {
  const session = await getSession();
  if (!session?.supplierId) redirect("/login");

  const sp = (await searchParams) ?? {};
  const tab = (["new", "in-progress", "completed", "cancelled"].includes(sp.tab ?? "")
    ? sp.tab
    : "new") as SupplierTab;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const q = sp.q?.trim() ?? "";

  const [counts, { orders, total }] = await Promise.all([
    getSupplierTabCounts(session.supplierId),
    getBridalOrdersWithRelations({
      supplierId: session.supplierId,
      supplierTab: tab,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      q: q || undefined,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Suspense>
      <SupplierHomeClient
        tab={tab}
        page={page}
        totalPages={totalPages}
        total={total}
        q={q}
        counts={counts}
        orders={orders}
      />
    </Suspense>
  );
}
