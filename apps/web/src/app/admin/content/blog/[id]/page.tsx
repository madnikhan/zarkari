import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostByIdDb } from "@/lib/db/cms-blog";
import { isDbConfigured } from "@/lib/db";
import { demoBlogPosts } from "@/lib/data/seed";
import { getSession } from "@/lib/auth/session";
import { BlogPostEditor } from "@/components/admin/content/BlogEditors";
import { CmsOwnerBanner } from "@/components/admin/content/CmsOwnerBanner";

async function loadPost(id: string) {
  if (isDbConfigured()) {
    const post = await getBlogPostByIdDb(id);
    if (post) return post;
  }
  return demoBlogPosts.find((p) => p.id === id) ?? null;
}

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const isOwner = session?.role === "owner";
  const post = await loadPost(id);
  if (!post) notFound();

  return (
    <div className="p-4 lg:p-8">
      <Link href="/admin/content/blog" className="text-xs text-slate-500 hover:text-[#4C3BCF]">
        ← Blog
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1 mb-6">Edit post</h1>
      <CmsOwnerBanner isOwner={isOwner} />
      <BlogPostEditor post={post} isOwner={isOwner} />
    </div>
  );
}
