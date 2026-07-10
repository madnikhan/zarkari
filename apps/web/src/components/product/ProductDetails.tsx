"use client";

import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/data/seed";
import { formatPrice } from "@/lib/utils";
import type { SizeSelection, StandardSizeKey } from "@/lib/sizing";
import { formatSizeSummary } from "@/lib/sizing";
import { AddToCartButton } from "./AddToCartButton";
import { SizeGuide } from "./SizeGuide";
import { SizeSelector } from "./SizeSelector";
import { buildSizeStockMap, getVariantForSize, totalProductStock } from "@/lib/stock/sizes";

export function ProductDetails({ product }: { product: Product }) {
  const sizeStock = useMemo(() => buildSizeStockMap(product.variants), [product.variants]);
  const [selectedSize, setSelectedSize] = useState<StandardSizeKey | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [sizeSelection, setSizeSelection] = useState<SizeSelection | null>(null);

  const selectedVariant = useMemo(() => {
    if (selectedSize) return getVariantForSize(product, selectedSize);
    if (sizeSelection?.mode === "standard") {
      return getVariantForSize(product, sizeSelection.label as StandardSizeKey);
    }
    return product.variants.find((v) => v.inventoryQty > 0) ?? product.variants[0];
  }, [product, selectedSize, sizeSelection]);

  const price = selectedVariant?.price ?? product.variants[0]?.price ?? "0";
  const comingSoon = product.tags.includes("coming-soon");
  const totalStock = totalProductStock(product.variants);
  const sizeAvailable =
    sizeSelection?.mode === "standard"
      ? (sizeStock[sizeSelection.label as StandardSizeKey] ?? 0) > 0
      : sizeSelection?.mode === "custom"
        ? totalStock > 0
        : false;
  const available = !comingSoon && (sizeSelection ? sizeAvailable : totalStock > 0);
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  const images = product.images.length ? product.images : product.featuredImageUrl ? [product.featuredImageUrl] : [];

  const whatsappMessage = sizeSelection
    ? `Hi, I'd like to enquire about: ${product.title} (${formatSizeSummary(sizeSelection)})`
    : `Hi, I'd like to enquire about: ${product.title}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
      <div>
        <div className="relative aspect-[3/4] bg-sand/20 mb-4 overflow-hidden">
          {images[activeImage] && (
            <Image
              src={images[activeImage]}
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`relative w-20 h-24 flex-shrink-0 overflow-hidden border-2 transition-colors ${
                  i === activeImage ? "border-gold" : "border-transparent"
                }`}
              >
                <Image src={img} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="lg:py-4">
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-2">{product.fabric ?? "ZARKARI"}</p>
        <h1 className="font-display text-3xl md:text-4xl text-charcoal mb-4">{product.title}</h1>
        {!comingSoon && (
          <p className="text-xl text-charcoal mb-6">{formatPrice(price)}</p>
        )}
        <p className="text-charcoal/70 leading-relaxed mb-8">{product.description}</p>

        {!comingSoon && totalStock <= 0 && (
          <p className="text-sm text-red-600 mb-4 uppercase tracking-wider">Out of stock</p>
        )}

        {!comingSoon && totalStock > 0 && (
          <SizeSelector
            value={sizeSelection}
            onChange={setSizeSelection}
            stockBySize={sizeStock}
            onSizeSelect={setSelectedSize}
          />
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {!comingSoon && totalStock > 0 && (
            <AddToCartButton
              variantId={selectedVariant?.id ?? product.variants[0].id}
              sizeSelection={sizeSelection}
              available={available}
              className="flex-1"
            />
          )}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center gap-2 px-8 py-4 text-xs tracking-[0.2em] uppercase transition-colors ${
                comingSoon
                  ? "bg-charcoal text-cream hover:bg-gold hover:text-charcoal flex-1"
                  : "border border-charcoal text-charcoal hover:bg-charcoal hover:text-cream"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              {comingSoon ? "Enquire on WhatsApp" : "WhatsApp"}
            </a>
          )}
        </div>

        {!comingSoon && !sizeSelection && totalStock > 0 && (
          <p className="text-sm text-charcoal/50 mb-8 -mt-4">Select a size or enter custom measurements to add to bag.</p>
        )}

        {comingSoon && (
          <p className="text-sm text-charcoal/60 mb-8">
            This piece is coming soon. Enquire via WhatsApp to register your interest.
          </p>
        )}

        <details className="border-t border-sand pt-6">
          <summary className="text-xs tracking-[0.2em] uppercase text-charcoal/60 cursor-pointer hover:text-charcoal">
            Size Guide
          </summary>
          <div className="mt-4">
            <SizeGuide />
          </div>
        </details>
      </div>
    </div>
  );
}
