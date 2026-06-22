import { CatalogueGrid } from "@/components/home/CatalogueGrid";
import { VideoHeroCarousel } from "@/components/home/VideoHeroCarousel";
import { getProducts, getShopSettings } from "@/lib/data";

export default async function HomePage() {
  const [settings, products] = await Promise.all([getShopSettings(), getProducts(100)]);

  return (
    <>
      <VideoHeroCarousel tagline={settings.heroSubheadline} />
      <section id="catalogue" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="sr-only">ZARKARI Catalogue</h2>
          <CatalogueGrid products={products} />
        </div>
      </section>
    </>
  );
}
