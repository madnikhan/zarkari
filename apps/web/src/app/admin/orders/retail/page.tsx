import Link from "next/link";
import { getRetailOrders } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

export default async function RetailOrdersPage() {
  const orders = await getRetailOrders();

  return (
    <div className="p-4 lg:p-8">
      <Link href="/admin/dashboard" className="text-sm text-slate-500 hover:text-[#4C3BCF] mb-4 inline-block">
        ← Back to Dashboard
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Online Shop Orders</h1>

      <div className="boms-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Order</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Total</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-mono text-xs text-[#4C3BCF]">{order.orderNumber}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{order.customerName ?? order.customerEmail}</p>
                  <p className="text-xs text-slate-400">{order.customerEmail}</p>
                </td>
                <td className="px-4 py-3 font-medium">{formatPrice(order.total)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs bg-green-100 text-green-700 capitalize">{order.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString("en-GB")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && <p className="text-center text-slate-400 py-12 text-sm">No online orders yet.</p>}
      </div>
    </div>
  );
}
