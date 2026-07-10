"use client";

import Link from "next/link";
import { Suspense } from "react";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTableSearch } from "@/components/admin/AdminTableSearch";
import { AdminTableShell } from "@/components/admin/AdminTableShell";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  email?: string;
  orders: { id: string; orderNumber: string }[];
}

interface Props {
  customers: CustomerRow[];
  page: number;
  totalPages: number;
  total: number;
  q: string;
}

export function CustomersPageClient({ customers, page, totalPages, total, q }: Props) {
  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/customers?${qs}` : "/admin/customers";
  }

  return (
    <>
      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminTableSearch placeholder="Search name, phone, or email…" defaultValue={q} />
        </Suspense>
      </div>
      <AdminTableShell>
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50/95 z-10">
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Orders</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{c.email ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{c.orders.length}</td>
                <td className="px-4 py-3">
                  {c.orders[0] ? (
                    <Link
                      href={`/admin/orders/${c.orders[0].id}`}
                      className="text-xs text-[#4C3BCF] hover:underline"
                    >
                      View latest
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!customers.length && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </AdminTableShell>
      <AdminPagination page={page} totalPages={totalPages} totalItems={total} pageSize={20} buildHref={buildHref} />
    </>
  );
}
