"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/data/seed";
import { ProductGrid } from "@/components/product/ProductGrid";
import { cn } from "@/lib/utils";

type Filter = "all" | "coming-soon";

export function CatalogueGrid({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "coming-soon") {
      return products.filter((p) => p.tags.includes("coming-soon"));
    }
    return products.filter((p) => !p.tags.includes("coming-soon"));
  }, [filter, products]);

  return (
    <div>
      <div className="flex gap-6 mb-10 border-b border-sand">
        {(
          [
            ["all", "All"],
            ["coming-soon", "Coming Soon"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "pb-3 text-xs tracking-[0.2em] uppercase transition-colors border-b-2 -mb-px",
              filter === key
                ? "border-charcoal text-charcoal"
                : "border-transparent text-charcoal/40 hover:text-charcoal"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {filtered.length ? (
        <ProductGrid products={filtered} />
      ) : (
        <p className="text-charcoal/50 text-sm py-12 text-center">No products in this category.</p>
      )}
    </div>
  );
}
