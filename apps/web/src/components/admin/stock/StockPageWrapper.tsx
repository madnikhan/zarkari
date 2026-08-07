"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTableSearch } from "@/components/admin/AdminTableSearch";
import { StockPageClient } from "@/components/admin/stock/StockPageClient";
import { CargoArrivalsPanel } from "@/components/admin/stock/CargoArrivalsPanel";
import type { StockOverviewRow } from "@/lib/db/cms-products";
import { cn } from "@/lib/utils";

type StockTab = "ready-made" | "sample" | "custom";

interface Props {
  products: StockOverviewRow[];
  page: number;
  totalPages: number;
  total: number;
  q: string;
  dateQuery?: Record<string, string | undefined>;
  initialTab?: StockTab;
}

const TABS: { key: StockTab; label: string }[] = [
  { key: "ready-made", label: "Ready-made" },
  { key: "sample", label: "Sample arrivals" },
  { key: "custom", label: "Custom arrivals" },
];

function StockTabsInner({
  products,
  page,
  totalPages,
  total,
  q,
  dateQuery = {},
  initialTab = "ready-made",
}: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as StockTab | null;
  const tab: StockTab =
    tabParam && TABS.some((t) => t.key === tabParam) ? tabParam : initialTab;

  function tabHref(key: StockTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    if (key !== "ready-made") params.delete("page");
    return `/admin/stock?${params.toString()}`;
  }

  return (
    <>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabHref(t.key)}
            className={cn(
              "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
              tab === t.key
                ? "bg-slate-900 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "ready-made" && (
        <>
          <div className="mb-4">
            <AdminTableSearch placeholder="Search product name…" defaultValue={q} />
          </div>
          <StockPageClient products={products} dateQuery={dateQuery} />
          <AdminPagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={20}
            basePath="/admin/stock"
            query={{ q: q || undefined, tab: "ready-made", ...dateQuery }}
          />
        </>
      )}

      {tab === "sample" && (
        <>
          <div className="mb-4">
            <AdminTableSearch placeholder="Search sample name or box…" defaultValue={q} />
          </div>
          <CargoArrivalsPanel kind="sample" q={q} dateQuery={dateQuery} />
        </>
      )}

      {tab === "custom" && (
        <>
          <div className="mb-4">
            <AdminTableSearch placeholder="Search order or dress name…" defaultValue={q} />
          </div>
          <CargoArrivalsPanel kind="custom" q={q} dateQuery={dateQuery} />
        </>
      )}
    </>
  );
}

export function StockPageWrapper(props: Props) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-400">Loading…</p>}>
      <StockTabsInner {...props} />
    </Suspense>
  );
}
