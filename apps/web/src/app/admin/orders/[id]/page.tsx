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
import { notFound } from "next/navigation";
import { CountdownBadge } from "@/components/orders/CountdownBadge";
import { OrderDetailTabs } from "@/components/orders/OrderDetailTabs";
import { OrderActionButtons } from "@/components/boms/OrderActionButtons";
import { StaffMessageForm } from "@/components/boms/StaffMessageForm";
import { StatusBadge } from "@/components/boms/StatusBadge";
import { CustomerCard } from "@/components/boms/CustomerCard";
import { OrderSummaryGrid, formatOrderDate, formatPrice } from "@/components/boms/OrderSummaryGrid";

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

  const summaryRows = [
    { label: "Booking Date", value: formatOrderDate(order.bookingDate) },
    { label: "Delivery Date", value: formatOrderDate(order.deliveryDate) },
    { label: "Supplier", value: supplier?.name ?? "—" },
    { label: "Dress Type", value: order.dressType || "—" },
    { label: "Total Amount", value: formatPrice(order.totalPrice), highlight: true },
    { label: "Deposit Paid", value: formatPrice(order.depositPaid) },
    { label: "Remaining", value: formatPrice(order.remainingBalance) },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto pb-24">
      <Link href="/admin/orders" className="text-sm text-slate-500 hover:text-[#4C3BCF] mb-4 inline-block">
        ← Back to Orders
      </Link>

      <div className="boms-card p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-semibold font-mono text-slate-900">{order.orderNumber}</h1>
            <div className="mt-2">
              <StatusBadge status={order.status} />
            </div>
          </div>
          <CountdownBadge deliveryDate={order.deliveryDate} />
        </div>
      </div>

      {customer && (
        <div className="mb-4">
          <CustomerCard
            name={customer.name}
            phone={customer.phone}
            email={customer.email}
            address={customer.address}
            orderNumber={order.orderNumber}
          />
        </div>
      )}

      <div className="mb-4">
        <OrderSummaryGrid rows={summaryRows} />
      </div>

      <div className="boms-card p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Actions</h2>
        <OrderActionButtons
          orderId={order.id}
          status={order.status}
          canOwnerActions={session?.role === "owner"}
          remainingBalance={order.remainingBalance}
        />
      </div>

      <div className="boms-card p-5">
        <OrderDetailTabs data={{ order, timeline, files, redesigns, cancellations, refunds, payments }} />
        {messages.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Notes</h3>
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
        <StaffMessageForm orderId={order.id} />
      </div>
    </div>
  );
}
