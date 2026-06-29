import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostByIdDb } from "@/lib/db/cms-blog";
import { isDbConfigured } from "@/lib/db";
import { demoBlogPosts } from "@/lib/data/seed";
import { BlogPostEditor } from "@/components/admin/content/BlogEditors";

async function loadPost(id: string) {
  if (isDbConfigured()) {
    const post = await getBlogPostByIdDb(id);
    if (post) return post;
  }
  return demoBlogPosts.find((p) => p.id === id) ?? null;
}

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await loadPost(id);
  if (!post) notFound();

  return (
    <div className="p-4 lg:p-8">
      <Link href="/admin/content/blog" className="text-xs text-slate-500 hover:text-[#4C3BCF]">
        ← Blog
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1 mb-6">Edit post</h1>
      <BlogPostEditor post={post} />
    </div>
  );
}
