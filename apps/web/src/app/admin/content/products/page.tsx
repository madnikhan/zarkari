import Link from "next/link";
import Image from "next/image";
import { getAllProducts } from "@/lib/data";
import { formatPrice } from "@/lib/utils";

export default async function ContentProductsPage() {
  const products = await getAllProducts(200);

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/content" className="text-xs text-slate-500 hover:text-[#4C3BCF]">
            ← Content
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">Products</h1>
        </div>
        <Link href="/admin/content/products/new" className="boms-btn-primary px-5 py-2.5 rounded-lg text-sm font-medium">
          Add product
        </Link>
      </div>
      <div className="boms-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4 hidden sm:table-cell">Handle</th>
              <th className="p-4">Price</th>
              <th className="p-4 hidden md:table-cell">Stock</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {p.featuredImageUrl && (
                      <div className="relative w-10 h-12 flex-shrink-0 rounded overflow-hidden bg-slate-100">
                        <Image src={p.featuredImageUrl} alt="" fill sizes="40px" className="object-cover" />
                      </div>
                    )}
                    <span className="font-medium text-slate-900">{p.title}</span>
                  </div>
                </td>
                <td className="p-4 font-mono text-xs text-slate-500 hidden sm:table-cell">{p.handle}</td>
                <td className="p-4">{formatPrice(p.variants[0]?.price ?? "0")}</td>
                <td className="p-4 hidden md:table-cell">{p.variants.reduce((s, v) => s + v.inventoryQty, 0)}</td>
                <td className="p-4 text-right">
                  <Link href={`/admin/content/products/${p.id}`} className="text-[#4C3BCF] text-xs font-medium hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
