import Link from "next/link";
import { getCollections } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { CollectionsManager } from "@/components/admin/content/CollectionsManager";
import { CmsOwnerBanner } from "@/components/admin/content/CmsOwnerBanner";

export default async function ContentCollectionsPage() {
  const session = await getSession();
  const isOwner = session?.role === "owner";
  const collections = await getCollections();

  return (
    <div className="p-4 lg:p-8">
      <Link href="/admin/content" className="text-xs text-slate-500 hover:text-[#4C3BCF]">
        ← Content
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1 mb-6">Collections</h1>
      <CmsOwnerBanner isOwner={isOwner} />
      <CollectionsManager initial={collections} isOwner={isOwner} />
    </div>
  );
}
