"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Supplier } from "@/lib/data/seed";

export function NewOrderForm({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    supplierId: suppliers[0]?.id ?? "",
    dressType: "",
    colour: "",
    size: "",
    totalPrice: "1000",
    customisationNotes: "",
    sendToSupplier: false,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      if (data.id) router.push(`/admin/orders/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setLoading(false);
    }
  }

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <label className="block text-sm">
      <span className="text-slate-500 text-xs uppercase tracking-wide">{label}</span>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
        required={["customerName", "customerPhone", "totalPrice"].includes(key)}
      />
    </label>
  );

  return (
    <form onSubmit={submit} className="boms-card p-6 space-y-5">
      {field("customerName", "Customer Name")}
      {field("customerPhone", "Phone")}
      {field("customerEmail", "Email")}
      <label className="block text-sm">
        <span className="text-slate-500 text-xs uppercase tracking-wide">Supplier</span>
        <select
          value={form.supplierId}
          onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
        >
          {suppliers.length === 0 ? (
            <option value="">No suppliers — add one in Users</option>
          ) : (
            suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))
          )}
        </select>
      </label>
      {field("dressType", "Dress Type")}
      {field("colour", "Colour")}
      {field("size", "Size")}
      {field("totalPrice", "Total Price (£)")}
      <label className="block text-sm">
        <span className="text-slate-500 text-xs uppercase tracking-wide">Customisation Notes</span>
        <textarea
          value={form.customisationNotes}
          onChange={(e) => setForm({ ...form, customisationNotes: e.target.value })}
          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 min-h-[80px]"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.sendToSupplier}
          onChange={(e) => setForm({ ...form, sendToSupplier: e.target.checked })}
        />
        Save &amp; Send to Supplier
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="boms-btn-primary w-full py-3 rounded-lg text-sm">
        {loading ? "Saving…" : "Create Order"}
      </button>
    </form>
  );
}
