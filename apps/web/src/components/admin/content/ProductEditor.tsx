"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/data/seed";
import type { Collection } from "@/lib/data/seed";
import { ProductImageGallery } from "@/components/admin/content/ProductImageGallery";
import { STANDARD_SIZES, type StandardSizeKey } from "@/lib/sizing";
import { buildSizeStockMap } from "@/lib/stock/sizes";

interface Props {
  product: Product;
  collections: Collection[];
  isOwner?: boolean;
}

export function ProductEditor({ product, collections, isOwner = true }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const initialImages =
    product.images.length > 0
      ? product.images
      : product.featuredImageUrl
        ? [product.featuredImageUrl]
        : [];
  const [images, setImages] = useState<string[]>(initialImages);
  const [featuredUrl, setFeaturedUrl] = useState(
    product.featuredImageUrl ?? initialImages[0] ?? ""
  );
  const initialSizeStock = buildSizeStockMap(product.variants);
  const [form, setForm] = useState({
    title: product.title,
    handle: product.handle,
    description: product.description,
    fabric: product.fabric ?? "",
    price: product.variants[0]?.price ?? "0",
    collectionHandles: product.collectionHandles,
    published: true,
    sizeStock: initialSizeStock,
  });

  function toggleCollection(handle: string) {
    setForm((f) => ({
      ...f,
      collectionHandles: f.collectionHandles.includes(handle)
        ? f.collectionHandles.filter((h) => h !== handle)
        : [...f.collectionHandles, handle],
    }));
  }

  function setSizeQty(size: StandardSizeKey, value: string) {
    const qty = Math.max(0, parseInt(value, 10) || 0);
    setForm((f) => ({
      ...f,
      sizeStock: { ...f.sizeStock, [size]: qty },
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const featured = featuredUrl || images[0] || "";
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          title: form.title,
          handle: form.handle,
          description: form.description,
          fabric: form.fabric || undefined,
          price: form.price,
          sizeStock: form.sizeStock,
          featuredImageUrl: featured,
          images: images.length ? images : featured ? [featured] : [],
          collectionHandles: form.collectionHandles,
          published: form.published,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      router.refresh();
      router.push("/admin/content/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const totalStock = STANDARD_SIZES.reduce((sum, s) => sum + form.sizeStock[s], 0);

  return (
    <form onSubmit={submit} className="boms-card p-6 space-y-4 max-w-2xl">
      {(["title", "handle", "fabric", "price"] as const).map((key) => (
        <div key={key}>
          <label className="text-xs text-slate-500 uppercase">{key}</label>
          <input
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            required={key === "title" || key === "price"}
          />
        </div>
      ))}
      <div>
        <label className="text-xs text-slate-500 uppercase block mb-2">
          Stock by size (total: {totalStock})
        </label>
        <div className="grid grid-cols-5 gap-2">
          {STANDARD_SIZES.map((size) => (
            <div key={size}>
              <label className="text-xs text-slate-400 block text-center mb-1">{size}</label>
              <input
                type="number"
                min={0}
                value={form.sizeStock[size]}
                onChange={(e) => setSizeQty(size, e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-2 text-sm text-center"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          For detailed receive/adjust history use the{" "}
          <a href="/admin/stock" className="text-[#4C3BCF] hover:underline">
            Stock page
          </a>
          .
        </p>
      </div>
      <div>
        <label className="text-xs text-slate-500 uppercase">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <ProductImageGallery
        images={images}
        featuredUrl={featuredUrl}
        onChange={(nextImages, nextFeatured) => {
          setImages(nextImages);
          setFeaturedUrl(nextFeatured);
        }}
      />
      <div>
        <label className="text-xs text-slate-500 uppercase block mb-2">Collections</label>
        <div className="flex flex-wrap gap-2">
          {collections.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => toggleCollection(col.handle)}
              className={`px-3 py-1 rounded-full text-xs border ${
                form.collectionHandles.includes(col.handle)
                  ? "bg-[#4C3BCF] text-white border-[#4C3BCF]"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              {col.title}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(e) => setForm({ ...form, published: e.target.checked })}
          disabled={!isOwner}
        />
        Published on storefront
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading || !isOwner} className="boms-btn-primary px-5 py-2 rounded-lg text-sm disabled:opacity-50">
        {loading ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}
