import Link from "next/link";
import { MediaLibrary } from "@/components/admin/content/MediaLibrary";

export default function ContentMediaPage() {
  return (
    <div className="p-4 lg:p-8">
      <Link href="/admin/content" className="text-xs text-slate-500 hover:text-[#4C3BCF]">
        ← Content
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1 mb-2">Media Library</h1>
      <p className="text-sm text-slate-500 mb-6">
        Upload images and videos once, then pick them directly in product, collection, and blog forms.
      </p>
      <MediaLibrary />
    </div>
  );
}
