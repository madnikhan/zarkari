import Link from "next/link";
import { getRetailOrders } from "@/lib/data";
import { RetailOrderRow } from "@/components/admin/RetailOrderRow";

export default async function RetailOrdersPage() {
  const orders = await getRetailOrders();

  return (
    <div className="p-4 lg:p-8">
      <Link href="/admin/dashboard" className="text-sm text-slate-500 hover:text-[#4C3BCF] mb-4 inline-block">
        ← Back to Dashboard
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Online Shop Orders</h1>

      <div className="boms-card overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Order</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Total</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <RetailOrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
        {!orders.length && <p className="text-center text-slate-400 py-12 text-sm">No online orders yet.</p>}
      </div>
    </div>
  );
}
