import { getActiveFinanceSummary, getBridalOrdersWithRelations, getPaymentsForOrders } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { RecordPaymentForm } from "@/components/boms/RecordPaymentForm";

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function AdminPaymentsPage({ searchParams }: Props) {
  const { page: pageStr = "1" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  const [summary, { orders, total }] = await Promise.all([
    getActiveFinanceSummary(),
    getBridalOrdersWithRelations({
      activeOnly: true,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
  ]);

  const payments = await getPaymentsForOrders(orders.map((o) => o.id));
  const paymentCountByOrder = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.orderId] = (acc[p.orderId] ?? 0) + 1;
    return acc;
  }, {});

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Payments</h1>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="boms-card p-6">
          <p className="text-xs text-slate-500 uppercase">Deposits Received</p>
          <p className="text-2xl font-semibold text-emerald-600 mt-1">{formatPrice(String(summary.totalDeposits))}</p>
        </div>
        <div className="boms-card p-6">
          <p className="text-xs text-slate-500 uppercase">Outstanding Balance</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">{formatPrice(String(summary.totalOutstanding))}</p>
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
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-[#4C3BCF] hover:underline">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatPrice(order.totalPrice)}</td>
                <td className="px-4 py-3 text-emerald-600">{formatPrice(order.depositPaid)}</td>
                <td className="px-4 py-3 text-amber-600">{formatPrice(order.remainingBalance)}</td>
                <td className="px-4 py-3 text-slate-500">{paymentCountByOrder[order.id] ?? 0} recorded</td>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`/admin/payments?page=${page - 1}`}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/payments?page=${page + 1}`}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
