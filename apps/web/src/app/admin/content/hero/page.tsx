import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { HeroMediaLibrary } from "@/components/admin/content/HeroMediaLibrary";
import { CmsOwnerBanner } from "@/components/admin/content/CmsOwnerBanner";

export default async function ContentHeroPage() {
  const session = await getSession();
  const isOwner = session?.role === "owner";

  return (
    <div className="p-4 lg:p-8">
      <Link href="/admin/content" className="text-xs text-slate-500 hover:text-[#4C3BCF]">
        ← Content
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1 mb-2">Hero Media</h1>
      <p className="text-sm text-slate-500 mb-6">
        Manage homepage video clips in the dedicated R2 hero folder.{" "}
        <Link href="/admin/content/homepage" className="text-[#4C3BCF] hover:underline">
          Choose which clips play on Homepage →
        </Link>
      </p>
      <CmsOwnerBanner isOwner={isOwner} />
      <HeroMediaLibrary />
    </div>
  );
}
