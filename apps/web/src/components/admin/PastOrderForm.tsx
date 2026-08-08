"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Supplier } from "@/lib/data/seed";
import { ALL_BRIDAL_STATUSES, getStatusLabel } from "@/lib/orders/status-machine";

interface Props {
  suppliers: Supplier[];
}

export function PastOrderForm({ suppliers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    dressType: "",
    totalPrice: "",
    depositPaid: "",
    remainingBalance: "",
    bookingDate: "",
    deliveryDate: "",
    status: "collected",
    orderNumber: "",
    supplierId: "",
    notes: "",
  });

  const remainingHint = useMemo(() => {
    const total = parseFloat(form.totalPrice) || 0;
    const deposit = parseFloat(form.depositPaid) || 0;
    if (form.remainingBalance !== "") return form.remainingBalance;
    return Math.max(0, total - deposit).toFixed(2);
  }, [form.totalPrice, form.depositPaid, form.remainingBalance]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders/past", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          supplierId: form.supplierId || undefined,
          orderNumber: form.orderNumber.trim() || undefined,
          remainingBalance: form.remainingBalance || remainingHint,
          notes: form.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.push(`/admin/orders/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 bg-white border border-slate-200 rounded-xl p-6">
      <p className="text-sm text-slate-500">
        Past orders skip cash ledger posts and WhatsApp. Default status is Collected.
      </p>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="text-xs uppercase text-slate-500">Customer name</span>
          <input
            required
            value={form.customerName}
            onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs uppercase text-slate-500">Phone</span>
          <input
            required
            value={form.customerPhone}
            onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs uppercase text-slate-500">Dress type</span>
          <input
            required
            type="text"
            value={form.dressType}
            onChange={(e) => setForm((f) => ({ ...f, dressType: e.target.value }))}
            placeholder="e.g. Lehenga, Suit…"
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs uppercase text-slate-500">Status</span>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
          >
            {ALL_BRIDAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {getStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-xs uppercase text-slate-500">Total (£)</span>
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={form.totalPrice}
            onChange={(e) => {
              const total = parseFloat(e.target.value);
              const deposit =
                !isNaN(total) && total > 0 && !form.depositPaid
                  ? (total * 0.5).toFixed(2)
                  : form.depositPaid;
              setForm((f) => ({ ...f, totalPrice: e.target.value, depositPaid: deposit }));
            }}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs uppercase text-slate-500">Deposit paid (£)</span>
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={form.depositPaid}
            onChange={(e) => setForm((f) => ({ ...f, depositPaid: e.target.value }))}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs uppercase text-slate-500">Remaining (£)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.remainingBalance}
            placeholder={remainingHint}
            onChange={(e) => setForm((f) => ({ ...f, remainingBalance: e.target.value }))}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs uppercase text-slate-500">Order number (optional)</span>
          <input
            value={form.orderNumber}
            onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value }))}
            placeholder="BR-2024-0001 — auto if blank"
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs uppercase text-slate-500">Booking date</span>
          <input
            required
            type="date"
            value={form.bookingDate}
            onChange={(e) => setForm((f) => ({ ...f, bookingDate: e.target.value }))}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs uppercase text-slate-500">Delivery date</span>
          <input
            required
            type="date"
            value={form.deliveryDate}
            onChange={(e) => setForm((f) => ({ ...f, deliveryDate: e.target.value }))}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-xs uppercase text-slate-500">Supplier (optional)</span>
          <select
            value={form.supplierId}
            onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
          >
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-xs uppercase text-slate-500">Notes (optional)</span>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="boms-btn-primary px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save past order"}
      </button>
    </form>
  );
}
