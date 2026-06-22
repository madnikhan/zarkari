import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/product/ProductDetails";
import { MetaViewContent } from "@/components/product/MetaViewContent";
import { getProductByHandle } from "@/lib/data";
import { pageMetadata } from "@/lib/seo/site-metadata";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) return { title: "Product" };
  return pageMetadata(product.title, product.description);
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  return (
    <section className="py-12 md:py-16">
      <MetaViewContent productId={product.id} title={product.title} price={product.variants[0]?.price ?? "0"} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductDetails product={product} />
      </div>
    </section>
  );
}
