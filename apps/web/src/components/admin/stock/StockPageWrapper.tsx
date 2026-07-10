"use client";

import { Suspense } from "react";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTableSearch } from "@/components/admin/AdminTableSearch";
import { StockPageClient } from "@/components/admin/stock/StockPageClient";
import type { StockOverviewRow } from "@/lib/db/cms-products";

interface Props {
  products: StockOverviewRow[];
  page: number;
  totalPages: number;
  total: number;
  q: string;
}

export function StockPageWrapper({ products, page, totalPages, total, q }: Props) {
  return (
    <>
      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminTableSearch placeholder="Search product name…" defaultValue={q} />
        </Suspense>
      </div>
      <StockPageClient products={products} />
      <AdminPagination page={page} totalPages={totalPages} totalItems={total} pageSize={20} basePath="/admin/stock" query={{ q: q || undefined }} />
    </>
  );
}
