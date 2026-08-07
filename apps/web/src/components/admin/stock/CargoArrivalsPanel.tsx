"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { getStatusLabel } from "@/lib/orders/status-machine";
import type { BridalStatus } from "@/lib/data/seed";

export type CargoArrivalRow = {
  id: string;
  itemDate: string;
  articleName: string;
  itemKind: "custom" | "sample";
  imageUrl?: string;
  costPkr: string;
  costGbp: string;
  boxId: string;
  boxNumber: string;
  supplierName?: string;
  cargoCompanyName?: string;
  bridalOrderId?: string;
  orderNumber?: string;
  orderStatus?: string;
};

interface Props {
  kind: "sample" | "custom";
  q?: string;
  dateQuery?: Record<string, string | undefined>;
}

export function CargoArrivalsPanel({ kind, q = "", dateQuery = {} }: Props) {
  const [items, setItems] = useState<CargoArrivalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ kind, limit: "100" });
        if (q) params.set("q", q);
        if (dateQuery.from) params.set("from", dateQuery.from);
        if (dateQuery.to) params.set("to", dateQuery.to);
        const res = await fetch(`/api/stock/cargo-arrivals?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load");
        if (!cancelled) {
          setItems(data.items ?? []);
          setTotal(data.total ?? 0);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [kind, q, dateQuery.from, dateQuery.to]);

  if (loading) {
    return <p className="text-sm text-slate-400 py-8 text-center">Loading arrivals…</p>;
  }
  if (error) {
    return <p className="text-sm text-red-600 py-4">{error}</p>;
  }

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">
        Pieces received in cargo boxes. Ready-made shop/online stock is on the Ready-made tab.{" "}
        <span className="text-slate-400">({total} items)</span>
      </p>
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2.5 font-medium w-14">Photo</th>
              <th className="px-3 py-2.5 font-medium">Name</th>
              <th className="px-3 py-2.5 font-medium">Date</th>
              <th className="px-3 py-2.5 font-medium">Box</th>
              <th className="px-3 py-2.5 font-medium">Supplier</th>
              <th className="px-3 py-2.5 font-medium">Cargo</th>
              <th className="px-3 py-2.5 font-medium text-right">PKR</th>
              <th className="px-3 py-2.5 font-medium text-right">GBP</th>
              {kind === "custom" && <th className="px-3 py-2.5 font-medium">Order</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length ? (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2">
                    {item.imageUrl ? (
                      <div className="relative h-10 w-10 rounded overflow-hidden border border-slate-200 bg-slate-50">
                        <Image src={item.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium">{item.articleName}</td>
                  <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                    {new Date(item.itemDate).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-3 py-2">
                    <Link href="/admin/cargo" className="font-mono text-xs text-[#4C3BCF] hover:underline">
                      {item.boxNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{item.supplierName || "—"}</td>
                  <td className="px-3 py-2 text-slate-600">{item.cargoCompanyName || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {parseFloat(item.costPkr).toLocaleString("en-GB", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-3 py-2 text-right">{formatPrice(item.costGbp)}</td>
                  {kind === "custom" && (
                    <td className="px-3 py-2">
                      {item.orderNumber && item.bridalOrderId ? (
                        <div>
                          <Link
                            href={`/admin/orders/${item.bridalOrderId}`}
                            className="font-mono text-xs text-[#4C3BCF] hover:underline"
                          >
                            {item.orderNumber}
                          </Link>
                          {item.orderStatus && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {getStatusLabel(item.orderStatus as BridalStatus)}
                            </p>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={kind === "custom" ? 9 : 8} className="px-3 py-10 text-center text-slate-400">
                  No {kind === "sample" ? "sample" : "custom"} arrivals yet. Add items in Box &amp; Cargo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
