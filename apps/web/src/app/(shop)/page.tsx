import { CatalogueGrid } from "@/components/home/CatalogueGrid";
import { VideoHeroCarousel } from "@/components/home/VideoHeroCarousel";
import { getProducts, getShopSettings, getProductByHandle, getCollectionByHandle } from "@/lib/data";

export default async function HomePage() {
  const settings = await getShopSettings();
  const featuredHandles =
    settings.featuredProductHandles
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const [products, featuredProducts, featuredCollection] = await Promise.all([
    getProducts(100),
    featuredHandles.length
      ? Promise.all(featuredHandles.map((h) => getProductByHandle(h))).then((arr) =>
          arr.filter((p): p is NonNullable<typeof p> => Boolean(p))
        )
      : Promise.resolve([]),
    settings.featuredCollectionHandle
      ? getCollectionByHandle(settings.featuredCollectionHandle)
      : Promise.resolve(null),
  ]);

  const catalogueProducts =
    featuredProducts.length > 0 ? featuredProducts : featuredCollection?.products?.length ? featuredCollection.products : products;

  return (
    <>
      <VideoHeroCarousel tagline={settings.heroSubheadline} headline={settings.heroHeadline} />
      {featuredCollection && featuredProducts.length === 0 && (
        <section className="py-10 border-b border-sand/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl text-charcoal mb-6">{featuredCollection.title}</h2>
            <CatalogueGrid products={featuredCollection.products.slice(0, 8)} />
          </div>
        </section>
      )}
      <section id="catalogue" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">ZARKARI Catalogue</h2>
          {featuredProducts.length > 0 && (
            <h2 className="font-display text-2xl text-charcoal mb-6">Featured</h2>
          )}
          <CatalogueGrid products={catalogueProducts} />
        </div>
      </section>
    </>
  );
}
