import { getBridalOrders, getPayments } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { RecordPaymentForm } from "@/components/boms/RecordPaymentForm";

export default async function AdminPaymentsPage() {
  const orders = await getBridalOrders();
  const active = orders.filter((o) => !["cancelled", "refunded"].includes(o.status));

  const rows = await Promise.all(
    active.map(async (order) => {
      const payments = await getPayments(order.id);
      return { order, payments };
    })
  );

  const totalOutstanding = active.reduce((s, o) => s + parseFloat(o.remainingBalance), 0);
  const totalDeposits = active.reduce((s, o) => s + parseFloat(o.depositPaid), 0);

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Payments</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="boms-card p-6">
          <p className="text-xs text-slate-500 uppercase">Deposits Received</p>
          <p className="text-2xl font-semibold text-emerald-600 mt-1">{formatPrice(String(totalDeposits))}</p>
        </div>
        <div className="boms-card p-6">
          <p className="text-xs text-slate-500 uppercase">Outstanding Balance</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">{formatPrice(String(totalOutstanding))}</p>
        </div>
      </div>

      <div className="boms-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Order</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Total</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Deposit</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Balance</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Payments</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ order, payments }) => (
              <tr key={order.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-[#4C3BCF] hover:underline">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatPrice(order.totalPrice)}</td>
                <td className="px-4 py-3 text-emerald-600">{formatPrice(order.depositPaid)}</td>
                <td className="px-4 py-3 text-amber-600">{formatPrice(order.remainingBalance)}</td>
                <td className="px-4 py-3 text-slate-500">{payments.length} recorded</td>
                <td className="px-4 py-3">
                  <RecordPaymentForm
                    orderId={order.id}
                    orderNumber={order.orderNumber}
                    remainingBalance={order.remainingBalance}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
