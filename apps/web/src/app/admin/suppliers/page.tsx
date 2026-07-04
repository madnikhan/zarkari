import { getSuppliers, getAllSupplierPerformance } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { SuppliersManager } from "@/components/admin/SuppliersManager";

export default async function AdminSuppliersPage() {
  const session = await getSession();
  const [suppliers, performance] = await Promise.all([getSuppliers(), getAllSupplierPerformance()]);

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Suppliers</h1>
      <p className="text-sm text-slate-500 mb-6">Manage supplier details and performance.</p>
      {session?.role === "owner" ? (
        <SuppliersManager initialSuppliers={suppliers} performance={performance} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="boms-card p-6">
              <h2 className="font-semibold text-slate-900">{supplier.name}</h2>
              <p className="text-sm text-slate-500">{supplier.email ?? supplier.phone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
