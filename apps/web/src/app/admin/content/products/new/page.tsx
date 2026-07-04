"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProductImageGallery } from "@/components/admin/content/ProductImageGallery";

export default function NewContentProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [featuredUrl, setFeaturedUrl] = useState("");
  const [form, setForm] = useState({
    title: "",
    handle: "",
    description: "",
    fabric: "",
    price: "",
    collectionHandles: "catalogue",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const featured = featuredUrl || images[0] || "";
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          featuredImageUrl: featured,
          images: images.length ? images : featured ? [featured] : [],
          collectionHandles: form.collectionHandles.split(",").map((s) => s.trim()),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/content/products/${data.product.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <Link href="/admin/content/products" className="text-xs text-slate-500 hover:text-[#4C3BCF]">
        ← Products
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1 mb-6">Add product</h1>
      <form onSubmit={submit} className="boms-card p-6 space-y-4">
        {(["title", "handle", "description", "fabric", "price"] as const).map((key) => (
          <label key={key} className="block text-sm">
            <span className="text-xs text-slate-500 uppercase">{key}</span>
            {key === "description" ? (
              <textarea
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 min-h-[80px]"
              />
            ) : (
              <input
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                required={key === "title" || key === "price"}
              />
            )}
          </label>
        ))}
        <ProductImageGallery
          images={images}
          featuredUrl={featuredUrl}
          onChange={(nextImages, nextFeatured) => {
            setImages(nextImages);
            setFeaturedUrl(nextFeatured);
          }}
        />
        <label className="block text-sm">
          <span className="text-xs text-slate-500 uppercase">Collections (comma-separated handles)</span>
          <input
            value={form.collectionHandles}
            onChange={(e) => setForm({ ...form, collectionHandles: e.target.value })}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
          />
        </label>
        <button type="submit" disabled={loading} className="boms-btn-primary w-full py-3 rounded-lg text-sm">
          {loading ? "Creating…" : "Create product"}
        </button>
      </form>
    </div>
  );
}
