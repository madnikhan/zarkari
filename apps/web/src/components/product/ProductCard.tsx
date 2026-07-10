import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/data/seed";
import { formatPrice } from "@/lib/utils";
import { getStorefrontStockLabel } from "@/lib/stock/sizes";

export function ProductCard({ product }: { product: Product }) {
  const variant = product.variants[0];
  const price = variant?.price ?? "0";
  const comingSoon = product.tags.includes("coming-soon");
  const stockLabel = comingSoon ? null : getStorefrontStockLabel(product.variants);

  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-sand/20 mb-3">
        {product.featuredImageUrl ? (
          <Image
            src={product.featuredImageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full bg-sand/50" />
        )}
        {comingSoon && (
          <span className="absolute top-3 left-3 bg-charcoal/90 text-cream text-[10px] tracking-widest uppercase px-2 py-1">
            Coming Soon
          </span>
        )}
        {!comingSoon && stockLabel === "sold_out" && (
          <span className="absolute top-3 left-3 bg-charcoal/90 text-cream text-[10px] tracking-widest uppercase px-2 py-1">
            Sold out
          </span>
        )}
        {!comingSoon && stockLabel === "low_stock" && (
          <span className="absolute top-3 left-3 bg-amber-500/95 text-white text-[10px] tracking-widest uppercase px-2 py-1">
            Low stock
          </span>
        )}
      </div>
      <h3 className="text-sm text-charcoal mb-0.5 line-clamp-1">{product.title}</h3>
      {!comingSoon && <p className="text-sm text-charcoal/60">{formatPrice(price)}</p>}
    </Link>
  );
}
