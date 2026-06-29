import Link from "next/link";
import { FileText, Image, Layout, Package, PenLine, Sparkles } from "lucide-react";

const modules = [
  { href: "/admin/content/products", label: "Products", description: "Catalogue items, prices, images", icon: Package },
  { href: "/admin/content/collections", label: "Collections", description: "Group products for storefront", icon: Layout },
  { href: "/admin/content/homepage", label: "Homepage", description: "Hero text and announcements", icon: Sparkles },
  { href: "/admin/content/media", label: "Media Library", description: "Upload and copy image URLs", icon: Image },
  { href: "/admin/content/blog", label: "Blog", description: "Articles and Soro posts", icon: PenLine },
];

export default function ContentHubPage() {
  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Content</h1>
        <p className="text-sm text-slate-500 mt-1">Manage storefront content — changes go live without redeploying.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link key={mod.href} href={mod.href} className="boms-card p-5 hover:border-[#4C3BCF]/30 transition-colors group">
              <Icon className="h-8 w-8 text-[#4C3BCF] mb-3" />
              <h2 className="font-semibold text-slate-900 group-hover:text-[#4C3BCF]">{mod.label}</h2>
              <p className="text-sm text-slate-500 mt-1">{mod.description}</p>
            </Link>
          );
        })}
      </div>
      <p className="mt-8 text-xs text-slate-400 flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Content is stored in Neon + Cloudflare R2 and served on the live site immediately.
      </p>
    </div>
  );
}
