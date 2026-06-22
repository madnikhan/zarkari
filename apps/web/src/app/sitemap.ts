import { getCollections, getProducts } from "@/lib/data";
import { staticPages } from "@/lib/pages";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zarkari.co.uk";

export default async function sitemap() {
  const [products, collections] = await Promise.all([getProducts(100), getCollections()]);

  const routes = [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/size-guide`, lastModified: new Date() },
    { url: `${siteUrl}/my-order`, lastModified: new Date() },
    ...products.map((p) => ({ url: `${siteUrl}/products/${p.handle}`, lastModified: new Date() })),
    ...collections
      .filter((c) => c.handle !== "catalogue")
      .map((c) => ({ url: `${siteUrl}/collections/${c.handle}`, lastModified: new Date() })),
    ...staticPages.map((p) => ({ url: `${siteUrl}/pages/${p.slug}`, lastModified: new Date() })),
  ];

  return routes.map((r) => ({
    url: r.url,
    lastModified: r.lastModified,
    changeFrequency: "weekly" as const,
    priority: r.url === siteUrl ? 1 : 0.7,
  }));
}
