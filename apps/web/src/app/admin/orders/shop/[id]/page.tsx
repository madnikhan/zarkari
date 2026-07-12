import Link from "next/link";
import { notFound } from "next/navigation";
import { getRetailOrderByIdDb } from "@/lib/db/retail-orders";
import { RetailOrderStatusSelect } from "@/components/admin/RetailOrderStatusSelect";
import { InvoiceActions } from "@/components/admin/InvoiceActions";
import { MEASUREMENT_FIELDS, formatInches } from "@/lib/sizing";
import { formatPrice } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

const SOURCE_LABELS = {
  online: "Online shop",
  walk_in: "Walk-in shop",
};

const PAYMENT_LABELS = {
  stripe: "Stripe (online)",
  cash: "Cash",
  card: "Card",
};

export default async function ShopOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getRetailOrderByIdDb(id);
  if (!order) notFound();

  const source = order.source ?? "online";

  return (
    <div className="p-4 lg:p-8 max-w-3xl">
      <Link href="/admin/orders" className="text-sm text-slate-500 hover:text-[#4C3BCF] mb-4 inline-block">
        ← Back to Orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
            {SOURCE_LABELS[source]} order
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 font-mono">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date(order.createdAt).toLocaleString("en-GB")}
          </p>
        </div>
        <RetailOrderStatusSelect orderId={order.id} currentStatus={order.status} />
      </div>

      <div className="boms-card p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Invoice</h2>
        <InvoiceActions
          kind="retail"
          orderId={order.id}
          orderNumber={order.orderNumber}
          customerName={order.customerName}
          customerPhone={order.customerPhone}
        />
      </div>

      <div className="boms-card p-5 mb-4 space-y-2">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Customer</h2>
        <p className="font-medium">{order.customerName ?? "—"}</p>
        {order.customerPhone && <p className="text-sm text-slate-600">{order.customerPhone}</p>}
        {order.customerEmail && <p className="text-sm text-slate-600">{order.customerEmail}</p>}
      </div>

      <div className="boms-card p-5 mb-4 space-y-2">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Payment</h2>
        <p className="text-sm">
          {order.paymentMethod ? PAYMENT_LABELS[order.paymentMethod] : "—"}
        </p>
        <p className="text-xl font-semibold">{formatPrice(order.total)}</p>
      </div>

      <div className="boms-card p-5">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Items</h2>
        <ul className="space-y-4">
          {order.items.map((item, idx) => (
            <li key={idx} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
              <p className="font-medium">
                {item.title} × {item.quantity} — {formatPrice(item.price)}
              </p>
              {item.sizeSelection && (
                <div className="mt-2 text-slate-600">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                    {item.sizeSelection.mode === "standard"
                      ? `Size ${item.sizeSelection.label}`
                      : "Custom measurements"}
                  </p>
                  {item.sizeSelection.mode === "custom" && (
                    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-xs">
                      {MEASUREMENT_FIELDS.map((field) => (
                        <div key={field.key}>
                          <dt className="text-slate-400">{field.label}</dt>
                          <dd className="font-medium">
                            {formatInches(item.sizeSelection!.measurements[field.key])}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
