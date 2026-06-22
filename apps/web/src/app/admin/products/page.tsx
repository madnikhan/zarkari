import Link from "next/link";
import { getProducts } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

export default async function AdminProductsPage() {
  const products = await getProducts(100);

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-charcoal">Products</h1>
        <Link href="/admin/products/new" className="px-5 py-2.5 bg-charcoal text-cream text-xs tracking-[0.15em] uppercase rounded">
          Add Product
        </Link>
      </div>
      <div className="bg-white rounded-lg border border-sand overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand/30 text-left">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Handle</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-sand">
                <td className="p-4 flex items-center gap-3">
                  {p.featuredImageUrl && (
                    <div className="relative w-10 h-12 flex-shrink-0">
                      <Image src={p.featuredImageUrl} alt="" fill sizes="40px" className="object-cover rounded" />
                    </div>
                  )}
                  {p.title}
                </td>
                <td className="p-4 font-mono text-xs">{p.handle}</td>
                <td className="p-4">{formatPrice(p.variants[0]?.price ?? "0")}</td>
                <td className="p-4">{p.variants.reduce((s, v) => s + v.inventoryQty, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-charcoal/50 mt-4">Manage catalog here. Images upload to R2 when configured via /api/upload.</p>
    </div>
  );
}
