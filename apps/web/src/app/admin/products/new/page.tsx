"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    handle: "",
    description: "",
    fabric: "",
    price: "",
    featuredImageUrl: "",
    collectionHandles: "catalogue",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          collectionHandles: form.collectionHandles.split(",").map((s) => s.trim()),
        }),
      });
      if (res.ok) router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-2xl">
      <h1 className="font-display text-3xl text-charcoal mb-8">Add Product</h1>
      <form onSubmit={submit} className="space-y-4 bg-white border border-sand rounded-lg p-6">
        {(["title", "handle", "description", "fabric", "price", "featuredImageUrl"] as const).map((key) => (
          <label key={key} className="block text-sm">
            <span className="text-charcoal/60 text-xs uppercase">{key}</span>
            <input
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="mt-1 w-full border border-sand rounded px-3 py-2"
              required={key === "title" || key === "price"}
            />
          </label>
        ))}
        <label className="block text-sm">
          <span className="text-charcoal/60 text-xs uppercase">Collections (comma-separated handles)</span>
          <input value={form.collectionHandles} onChange={(e) => setForm({ ...form, collectionHandles: e.target.value })} className="mt-1 w-full border border-sand rounded px-3 py-2" />
        </label>
        <button type="submit" disabled={loading} className="w-full py-3 bg-charcoal text-cream text-xs uppercase tracking-wide rounded">
          {loading ? "Saving..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
