import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getSuppliers } from "@/lib/data";
import { PastOrderForm } from "@/components/admin/PastOrderForm";

export default async function PastOrderNewPage() {
  const session = await getSession();
  const suppliers = await getSuppliers(session?.role === "owner");

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Add past order</h1>
          <p className="text-sm text-slate-500 mt-1">Historical bridal/custom order — no cash or WhatsApp</p>
        </div>
        <Link href="/admin/orders/import" className="text-sm text-[#4C3BCF] hover:underline">
          Bulk CSV import →
        </Link>
      </div>
      <PastOrderForm suppliers={suppliers} />
    </div>
  );
}
