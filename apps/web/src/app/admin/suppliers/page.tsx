import { getSuppliers, getSupplierPerformance } from "@/lib/data";
import Link from "next/link";

export default async function AdminSuppliersPage() {
  const suppliers = await getSuppliers();
  const perfData = await Promise.all(
    suppliers.map(async (s) => ({ supplier: s, perf: getSupplierPerformance(s.id) }))
  );

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Suppliers</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {perfData.map(({ supplier, perf }) => (
          <div key={supplier.id} className="boms-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900">{supplier.name}</h2>
                <p className="text-sm text-slate-500">{supplier.email ?? supplier.phone}</p>
              </div>
              <span className="text-2xl font-bold text-[#4C3BCF]">{perf.successRate}%</span>
            </div>
            <dl className="grid grid-cols-3 gap-3 text-center text-sm">
              <div><dt className="text-slate-400 text-xs">Total</dt><dd className="font-semibold">{perf.total}</dd></div>
              <div><dt className="text-slate-400 text-xs">Completed</dt><dd className="font-semibold text-green-600">{perf.completed}</dd></div>
              <div><dt className="text-slate-400 text-xs">Late</dt><dd className="font-semibold text-red-600">{perf.lateDeliveries}</dd></div>
            </dl>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-6">
        Manage supplier accounts in <Link href="/admin/users" className="text-[#4C3BCF] hover:underline">Users</Link>.
      </p>
    </div>
  );
}
