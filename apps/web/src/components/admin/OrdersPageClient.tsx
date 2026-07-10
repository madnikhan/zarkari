"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UnifiedOrder } from "@/lib/db/unified-orders";
import { UnifiedOrdersTable } from "@/components/admin/UnifiedOrdersTable";
import { WalkInSaleForm } from "@/components/admin/WalkInSaleForm";
import { cn } from "@/lib/utils";

interface Props {
  orders: UnifiedOrder[];
  total: number;
  page: number;
  totalPages: number;
  typeFilter: string;
  tab: string;
}

export function OrdersPageClient({ orders, total, page, totalPages, typeFilter, tab }: Props) {
  const router = useRouter();
  const [walkInOpen, setWalkInOpen] = useState(false);

  const typeFilters = [
    { key: "all", label: "All" },
    { key: "custom", label: "Custom" },
    { key: "online", label: "Online" },
    { key: "walk_in", label: "Walk-in" },
  ];

  const customTabs = [
    { key: "active", label: "Active" },
    { key: "overdue", label: "Overdue" },
    { key: "due-week", label: "Due This Week" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
    { key: "refunded", label: "Refunded" },
  ];

  const shopTabs = [
    { key: "shop-open", label: "Open" },
    { key: "shop-shipped", label: "Shipped" },
    { key: "shop-delivered", label: "Delivered" },
    { key: "shop-cancelled", label: "Cancelled" },
  ];

  const allTabs = [
    { key: "recent", label: "Recent" },
    { key: "open", label: "Open" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const statusTabs =
    typeFilter === "custom"
      ? customTabs
      : typeFilter === "online" || typeFilter === "walk_in"
        ? shopTabs
        : allTabs;

  function hrefFor(next: { type?: string; tab?: string; page?: number }) {
    const params = new URLSearchParams();
    params.set("type", next.type ?? typeFilter);
    params.set("tab", next.tab ?? tab);
    if (next.page && next.page > 1) params.set("page", String(next.page));
    return `/admin/orders?${params.toString()}`;
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWalkInOpen(true)}
            className="px-4 py-2.5 rounded-lg text-sm font-medium border border-[#4C3BCF] text-[#4C3BCF] hover:bg-[#F4F3FF]"
          >
            Walk-in sale
          </button>
          <Link href="/admin/orders/new" className="boms-btn-primary px-5 py-2.5 rounded-lg text-sm font-medium">
            New custom order
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {typeFilters.map((t) => (
          <Link
            key={t.key}
            href={hrefFor({ type: t.key, tab: t.key === "custom" ? "active" : t.key === "all" ? "recent" : "shop-open", page: 1 })}
            className={cn(
              "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
              typeFilter === t.key
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {statusTabs.map((t) => (
          <Link
            key={t.key}
            href={hrefFor({ tab: t.key, page: 1 })}
            className={cn(
              "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
              tab === t.key ? "boms-btn-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <UnifiedOrdersTable orders={orders} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link href={hrefFor({ page: page - 1 })} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
              Previous
            </Link>
          )}
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages} ({total} orders)
          </span>
          {page < totalPages && (
            <Link href={hrefFor({ page: page + 1 })} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50">
              Next
            </Link>
          )}
        </div>
      )}

      <WalkInSaleForm
        open={walkInOpen}
        onClose={() => setWalkInOpen(false)}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
