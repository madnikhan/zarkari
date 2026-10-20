"use client";

import { useEffect, useMemo, useState } from "react";
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
  soldAt?: string;
  soldPriceGbp?: string;
  soldMethod?: "cash" | "online";
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

  const sampleStats = useMemo(() => {
    if (kind !== "sample") return null;
    const sold = items.filter((i) => i.soldAt);
    const available = items.filter((i) => !i.soldAt);
    return {
      received: items.length,
      sold: sold.length,
      available: available.length,
      soldItems: sold,
    };
  }, [kind, items]);

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

      {sampleStats && (
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-slate-700">
            Received <strong>{sampleStats.received}</strong>
          </span>
          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-800">
            Available <strong>{sampleStats.available}</strong>
          </span>
          <span className="rounded-lg bg-slate-800 px-3 py-1.5 text-white">
            Sold <strong>{sampleStats.sold}</strong>
          </span>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2.5 font-medium w-14">Photo</th>
              <th className="px-3 py-2.5 font-medium">Name</th>
              {kind === "sample" && <th className="px-3 py-2.5 font-medium">Status</th>}
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
                  {kind === "sample" && (
                    <td className="px-3 py-2">
                      {item.soldAt ? (
                        <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-white">
                          Sold
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                          Available
                        </span>
                      )}
                    </td>
                  )}
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
                <td
                  colSpan={kind === "custom" ? 9 : kind === "sample" ? 9 : 8}
                  className="px-3 py-10 text-center text-slate-400"
                >
                  No {kind === "sample" ? "sample" : "custom"} arrivals yet. Add items in Box &amp; Cargo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sampleStats && sampleStats.soldItems.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Sample sales</h3>
          <p className="text-xs text-slate-500 mb-3">
            Record of samples sold from Daily Cash (Ready Made Sale). Remaining = Available above.
          </p>
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Sample</th>
                  <th className="px-3 py-2.5 font-medium">Sold</th>
                  <th className="px-3 py-2.5 font-medium">Method</th>
                  <th className="px-3 py-2.5 font-medium text-right">Price</th>
                  <th className="px-3 py-2.5 font-medium">Box</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sampleStats.soldItems.map((item) => (
                  <tr key={`sold-${item.id}`}>
                    <td className="px-3 py-2 font-medium">{item.articleName}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {item.soldAt
                        ? new Date(item.soldAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2 capitalize text-slate-600">
                      {item.soldMethod === "online" ? "Card / bank" : item.soldMethod ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {item.soldPriceGbp ? formatPrice(item.soldPriceGbp) : "—"}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{item.boxNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
