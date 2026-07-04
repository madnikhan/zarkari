import Link from "next/link";
import type { BridalOrder, Customer } from "@/lib/data/seed";
import { formatPrice } from "@/lib/utils";
import { CountdownBadge } from "./CountdownBadge";
import { StatusBadge } from "@/components/boms/StatusBadge";

interface OrderCardProps {
  order: BridalOrder;
  customer?: Customer | null;
  supplierName?: string;
  href: string;
  showSupplier?: boolean;
}

export function OrderCard({ order, customer, supplierName, href, showSupplier = true }: OrderCardProps) {
  return (
    <Link
      href={href}
      className="block bg-white border border-sand rounded-lg p-5 hover:border-gold/50 transition-colors shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-mono text-sm font-semibold text-charcoal">{order.orderNumber}</p>
          <p className="text-sm text-charcoal/70 mt-0.5">{customer?.name ?? "Customer"}</p>
        </div>
        <CountdownBadge deliveryDate={order.deliveryDate} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-charcoal/60 mb-3">
        {order.dressType && <span>{order.dressType}</span>}
        {order.colour && <span>· {order.colour}</span>}
        {order.size && <span>· Size {order.size}</span>}
      </div>
      <div className="flex items-center justify-between">
        <StatusBadge status={order.status} />
        <span className="text-sm font-medium">{formatPrice(order.totalPrice)}</span>
      </div>
      {showSupplier && supplierName && (
        <p className="text-xs text-charcoal/50 mt-3">Supplier: {supplierName}</p>
      )}
    </Link>
  );
}
