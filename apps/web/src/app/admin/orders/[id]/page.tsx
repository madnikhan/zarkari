import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBridalOrderById,
  getCustomer,
  getOrderFiles,
  getSupplier,
  getTimeline,
  getRedesigns,
  getCancellations,
  getRefunds,
  getPayments,
  getMessages,
} from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { CountdownBadge } from "@/components/orders/CountdownBadge";
import { OrderDetailTabs } from "@/components/orders/OrderDetailTabs";
import { OrderActionButtons } from "@/components/boms/OrderActionButtons";
import { StaffMessageForm } from "@/components/boms/StaffMessageForm";
import { StatusBadge } from "@/components/boms/StatusBadge";
import { formatPrice } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const order = await getBridalOrderById(id);
  if (!order) notFound();

  const [customer, supplier, timeline, files, redesigns, cancellations, refunds, payments, messages] =
    await Promise.all([
    getCustomer(order.customerId),
    order.supplierId ? getSupplier(order.supplierId) : null,
    getTimeline(order.id),
    getOrderFiles(order.id),
    getRedesigns(order.id),
    getCancellations(order.id),
    getRefunds(order.id),
    getPayments(order.id),
    getMessages(order.id),
  ]);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <Link href="/admin/orders" className="text-sm text-slate-500 hover:text-[#4C3BCF] mb-4 inline-block">
        ← Back to Orders
      </Link>

      <div className="boms-card p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-semibold font-mono text-slate-900">{order.orderNumber}</h1>
            <p className="text-slate-600 mt-1">{customer?.name}</p>
            <p className="text-xs text-slate-400 mt-1">{customer?.phone}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={order.status} />
            <CountdownBadge deliveryDate={order.deliveryDate} />
          </div>
        </div>

        <dl className="grid sm:grid-cols-2 gap-4 text-sm border-t border-slate-100 pt-4">
          <div><dt className="text-slate-400 text-xs uppercase">Dress Type</dt><dd className="font-medium">{order.dressType}</dd></div>
          <div><dt className="text-slate-400 text-xs uppercase">Colour</dt><dd>{order.colour}</dd></div>
          <div><dt className="text-slate-400 text-xs uppercase">Size</dt><dd>{order.size}</dd></div>
          <div><dt className="text-slate-400 text-xs uppercase">Supplier</dt><dd>{supplier?.name ?? "—"}</dd></div>
          <div><dt className="text-slate-400 text-xs uppercase">Total Amount</dt><dd className="font-semibold">{formatPrice(order.totalPrice)}</dd></div>
          <div><dt className="text-slate-400 text-xs uppercase">Deposit Paid</dt><dd>{formatPrice(order.depositPaid)}</dd></div>
          <div><dt className="text-slate-400 text-xs uppercase">Remaining</dt><dd>{formatPrice(order.remainingBalance)}</dd></div>
          <div><dt className="text-slate-400 text-xs uppercase">Delivery Date</dt><dd>{new Date(order.deliveryDate).toLocaleDateString("en-GB")}</dd></div>
        </dl>
      </div>

      <div className="boms-card p-6 mb-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Actions</h2>
        <OrderActionButtons
          orderId={order.id}
          status={order.status}
          canOwnerActions={session?.role === "owner"}
          remainingBalance={order.remainingBalance}
        />
      </div>

      <div className="boms-card p-6">
        <OrderDetailTabs data={{ order, timeline, files, redesigns, cancellations, refunds, payments }} />
        {messages.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Messages</h3>
            <ul className="space-y-2 text-sm">
              {messages.map((m) => (
                <li key={m.id} className="bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-400 capitalize">{m.senderType}</span>
                  <p>{m.message}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        <StaffMessageForm orderId={order.id} senderName={session?.name} />
      </div>
    </div>
  );
}
