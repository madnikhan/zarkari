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
  getCustomerMessages,
  getSupplierMessages,
  getPendingSupplierUpdates,
} from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import { CountdownBadge } from "@/components/orders/CountdownBadge";
import { OrderDetailTabs } from "@/components/orders/OrderDetailTabs";
import { OrderActionButtons } from "@/components/boms/OrderActionButtons";
import { OrderMessagesLive } from "@/components/admin/OrderMessagesLive";
import { OrderStatusLive } from "@/components/orders/OrderStatusLive";
import { CustomerCard } from "@/components/boms/CustomerCard";
import { OrderWhatsAppBanner } from "@/components/admin/OrderWhatsAppBanner";
import { InvoiceActions } from "@/components/admin/InvoiceActions";
import { OrderSummaryGrid, formatOrderDate, formatPrice } from "@/components/boms/OrderSummaryGrid";
import { MeasurementsReadOnly } from "@/components/orders/MeasurementsReadOnly";
import { BridalOrderEditSection } from "@/components/admin/BridalOrderEditSection";
import { OrderMarginCard } from "@/components/admin/OrderMarginCard";
import { getOrderMarginForOrderDb } from "@/lib/db/order-margins";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const order = await getBridalOrderById(id);
  if (!order) notFound();

  const [customer, supplier, timeline, files, redesigns, cancellations, refunds, payments, customerMessages, supplierMessages, pendingUpdates, margin] =
    await Promise.all([
      getCustomer(order.customerId),
      order.supplierId ? getSupplier(order.supplierId) : null,
      getTimeline(order.id),
      getOrderFiles(order.id),
      getRedesigns(order.id),
      getCancellations(order.id),
      getRefunds(order.id),
      getPayments(order.id),
      getCustomerMessages(order.id),
      getSupplierMessages(order.id),
      getPendingSupplierUpdates(order.id),
      getOrderMarginForOrderDb(order.id, order.totalPrice),
    ]);

  if (pendingUpdates.length) {
    void import("@/lib/firebase/sync").then(async (m) => {
      for (const update of pendingUpdates) {
        if (update.reviewStatus && update.reviewStatus !== "pending") continue;
        await m.syncPendingUpdate(order.id, {
          id: update.id,
          senderType: update.senderType,
          senderName: update.senderName,
          message: update.message,
          createdAt: update.createdAt,
          attachmentUrl: update.attachmentUrl,
          attachmentKind: update.attachmentKind,
          reviewStatus: update.reviewStatus ?? "pending",
        });
      }
    });
  }

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

      <OrderWhatsAppBanner />

      <div className="boms-card p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-semibold font-mono text-slate-900">{order.orderNumber}</h1>
            <div className="mt-2">
              <OrderStatusLive orderId={order.id} initialStatus={order.status} />
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
            orderId={order.id}
          />
        </div>
      )}

      <div className="boms-card p-4 mb-4">
        <h2 className="text-xs font-semibold uppercase text-slate-500 mb-3">Invoice</h2>
        <InvoiceActions
          kind="bridal"
          orderId={order.id}
          orderNumber={order.orderNumber}
          customerName={customer?.name}
          customerPhone={customer?.phone}
          size="sm"
        />
      </div>

      <div className="mb-4">
        <OrderSummaryGrid rows={summaryRows} />
      </div>

      <OrderMarginCard margin={margin} />

      {(session?.role === "owner" || session?.role === "staff") && (
        <BridalOrderEditSection order={order} />
      )}

      <div className="mb-4">
        <MeasurementsReadOnly measurements={order.measurements} showEmpty />
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
        <OrderMessagesLive
          orderId={order.id}
          initialCustomerMessages={customerMessages}
          initialSupplierMessages={supplierMessages}
          initialPendingUpdates={pendingUpdates}
        />
      </div>
    </div>
  );
}
