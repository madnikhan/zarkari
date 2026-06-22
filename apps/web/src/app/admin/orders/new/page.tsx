"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    supplierId: "sup-001",
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
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.id) router.push(`/admin/orders/${data.id}`);
    } finally {
      setLoading(false);
    }
  }

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <label className="block text-sm">
      <span className="text-charcoal/60 text-xs uppercase tracking-wide">{label}</span>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-full border border-sand rounded px-3 py-2"
        required={["customerName", "customerPhone", "totalPrice"].includes(key)}
      />
    </label>
  );

  return (
    <div className="p-6 lg:p-10 max-w-2xl">
      <h1 className="font-display text-3xl text-charcoal mb-8">New Bridal Order</h1>
      <form onSubmit={submit} className="space-y-5 bg-white rounded-lg border border-sand p-6">
        {field("customerName", "Customer Name")}
        {field("customerPhone", "Phone")}
        {field("customerEmail", "Email")}
        <label className="block text-sm">
          <span className="text-charcoal/60 text-xs uppercase tracking-wide">Supplier</span>
          <select
            value={form.supplierId}
            onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            className="mt-1 w-full border border-sand rounded px-3 py-2"
          >
            <option value="sup-001">Karachi Atelier</option>
            <option value="sup-002">Lahore Embroidery Co</option>
          </select>
        </label>
        {field("dressType", "Dress Type")}
        {field("colour", "Colour")}
        {field("size", "Size")}
        {field("totalPrice", "Total Price (£)")}
        <label className="block text-sm">
          <span className="text-charcoal/60 text-xs uppercase tracking-wide">Customisation Notes</span>
          <textarea
            value={form.customisationNotes}
            onChange={(e) => setForm({ ...form, customisationNotes: e.target.value })}
            className="mt-1 w-full border border-sand rounded px-3 py-2 min-h-[80px]"
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
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-charcoal text-cream text-xs tracking-[0.15em] uppercase rounded hover:bg-gold hover:text-charcoal"
        >
          {loading ? "Saving..." : "Create Order"}
        </button>
      </form>
      <p className="text-xs text-charcoal/50 mt-4">50% deposit · 8-week default delivery</p>
    </div>
  );
}
