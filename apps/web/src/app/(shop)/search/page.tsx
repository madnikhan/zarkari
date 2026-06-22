import Link from "next/link";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getProducts } from "@/lib/data";
import type { Metadata } from "next";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : "Search" };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").toLowerCase();
  const all = await getProducts(100);
  const products = query
    ? all.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.tags.some((t) => t.includes(query)) ||
          p.description.toLowerCase().includes(query)
      )
    : [];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl text-charcoal mb-2">
          {query ? `Results for "${q}"` : "Search"}
        </h1>
        {query && (
          <p className="text-charcoal/50 text-sm mb-10">
            {products.length} {products.length === 1 ? "result" : "results"}
          </p>
        )}
        {!query ? (
          <p className="text-charcoal/60">Use the search bar to find products.</p>
        ) : products.length ? (
          <ProductGrid products={products} />
        ) : (
          <div className="text-center py-16">
            <p className="text-charcoal/60 mb-6">No products found.</p>
            <Link href="/" className="text-xs tracking-[0.2em] uppercase text-gold hover:text-charcoal">
              Browse Collections →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
