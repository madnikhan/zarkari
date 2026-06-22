"use client";

import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/data/seed";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "./AddToCartButton";
import { SizeGuide } from "./SizeGuide";

export function ProductDetails({ product }: { product: Product }) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [activeImage, setActiveImage] = useState(0);

  const sizes = [
    ...new Set(
      product.variants
        .map((v) => v.options.find((o) => o.name === "Size")?.value)
        .filter(Boolean)
    ),
  ];

  const price = selectedVariant?.price ?? product.variants[0]?.price ?? "0";
  const comingSoon = product.tags.includes("coming-soon");
  const available = !comingSoon && (selectedVariant?.inventoryQty ?? 0) > 0;
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  function selectSize(size: string) {
    const variant = product.variants.find((v) =>
      v.options.some((o) => o.name === "Size" && o.value === size)
    );
    if (variant) setSelectedVariant(variant);
  }

  const images = product.images.length ? product.images : product.featuredImageUrl ? [product.featuredImageUrl] : [];

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

        {sizes.length > 0 && sizes[0] !== "Default" && (
          <div className="mb-6">
            <p className="text-xs tracking-[0.2em] uppercase text-charcoal mb-3">Size</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => {
                const isSelected = selectedVariant?.options.some(
                  (o) => o.name === "Size" && o.value === size
                );
                const variant = product.variants.find((v) =>
                  v.options.some((o) => o.name === "Size" && o.value === size)
                );
                const inStock = (variant?.inventoryQty ?? 0) > 0;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => selectSize(size!)}
                    disabled={!inStock}
                    className={`min-w-[3rem] px-4 py-3 text-sm border transition-colors ${
                      isSelected
                        ? "border-charcoal bg-charcoal text-cream"
                        : inStock
                          ? "border-sand hover:border-charcoal"
                          : "border-sand/50 text-charcoal/30 line-through cursor-not-allowed"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {!comingSoon && (
            <AddToCartButton
              variantId={selectedVariant?.id ?? product.variants[0].id}
              available={available}
              className="flex-1"
            />
          )}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I'd like to enquire about: ${product.title}`)}`}
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
