import Link from "next/link";
import { getShopSettings } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { HomepageEditor } from "@/components/admin/content/HomepageEditor";
import { CmsOwnerBanner } from "@/components/admin/content/CmsOwnerBanner";

export default async function ContentHomepagePage() {
  const session = await getSession();
  const isOwner = session?.role === "owner";
  const settings = await getShopSettings();

  return (
    <div className="p-4 lg:p-8">
      <Link href="/admin/content" className="text-xs text-slate-500 hover:text-[#4C3BCF]">
        ← Content
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1 mb-2">Homepage</h1>
      <p className="text-sm text-slate-500 mb-6">
        Announcement bar, hero text, and featured content. Hero videos come from{" "}
        <Link href="/admin/content/hero" className="text-[#4C3BCF] hover:underline">
          Hero Media
        </Link>{" "}
        (<code className="text-xs">uploads/hero/</code>) — pick which clips play here.
      </p>
      <CmsOwnerBanner isOwner={isOwner} />
      <HomepageEditor initial={settings} isOwner={isOwner} />
    </div>
  );
}
