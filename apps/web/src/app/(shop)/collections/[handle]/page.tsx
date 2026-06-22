import { redirect } from "next/navigation";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getCollectionByHandle } from "@/lib/data";
import { pageMetadata } from "@/lib/seo/site-metadata";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCollectionByHandle(handle);
  if (!collection) return { title: "Collection" };
  return pageMetadata(collection.title, collection.description ?? undefined);
}

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params;
  if (handle === "catalogue") redirect("/");

  const collection = await getCollectionByHandle(handle);
  if (!collection) notFound();

  return (
    <>
      <section className="relative h-48 md:h-56 flex items-end overflow-hidden">
        {collection.imageUrl && (
          <Image
            src={collection.imageUrl}
            alt={collection.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-charcoal/50" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
          <h1 className="font-display text-3xl md:text-4xl text-cream mb-1">{collection.title}</h1>
          <p className="text-cream/70 text-sm max-w-lg">{collection.description}</p>
        </div>
      </section>
      <section className="py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductGrid products={collection.products} />
        </div>
      </section>
    </>
  );
}
