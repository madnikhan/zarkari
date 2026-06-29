import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById, getCollections } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { ProductEditor } from "@/components/admin/content/ProductEditor";
import { CmsOwnerBanner } from "@/components/admin/content/CmsOwnerBanner";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const isOwner = session?.role === "owner";
  const [product, collections] = await Promise.all([getProductById(id), getCollections()]);
  if (!product) notFound();

  return (
    <div className="p-4 lg:p-8">
      <Link href="/admin/content/products" className="text-xs text-slate-500 hover:text-[#4C3BCF]">
        ← Products
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1 mb-6">Edit: {product.title}</h1>
      <CmsOwnerBanner isOwner={isOwner} />
      <ProductEditor product={product} collections={collections} isOwner={isOwner} />
    </div>
  );
}
