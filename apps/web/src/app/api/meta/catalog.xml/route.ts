import { getProducts } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://zarkari.co.uk";

export async function GET() {
  const products = await getProducts(500);

  const items = products
    .map((p) => {
      const price = p.variants[0]?.price ?? "0";
      return `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.title}]]></g:title>
      <g:description><![CDATA[${p.description}]]></g:description>
      <g:link>${siteUrl}/products/${p.handle}</g:link>
      <g:image_link>${p.featuredImageUrl?.startsWith("/") ? `${siteUrl}${p.featuredImageUrl}` : p.featuredImageUrl ?? ""}</g:image_link>
      <g:availability>${p.variants.some((v) => v.inventoryQty > 0) ? "in stock" : "out of stock"}</g:availability>
      <g:price>${price} GBP</g:price>
      <g:brand>ZARKARI</g:brand>
      <g:condition>new</g:condition>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>ZARKARI Product Catalog</title>
    <link>${siteUrl}</link>
    <description>Pakistani women's clothing UK</description>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
