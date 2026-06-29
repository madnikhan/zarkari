import Link from "next/link";
import { getAllBlogPosts } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { NewBlogPostForm } from "@/components/admin/content/BlogEditors";
import { CmsOwnerBanner } from "@/components/admin/content/CmsOwnerBanner";

export default async function ContentBlogPage() {
  const session = await getSession();
  const isOwner = session?.role === "owner";
  const posts = await getAllBlogPosts(100);

  return (
    <div className="p-4 lg:p-8">
      <Link href="/admin/content" className="text-xs text-slate-500 hover:text-[#4C3BCF]">
        ← Content
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mt-1 mb-6">Blog</h1>
      <CmsOwnerBanner isOwner={isOwner} />
      <NewBlogPostForm isOwner={isOwner} />
      <div className="mt-8 boms-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4 hidden sm:table-cell">Author</th>
              <th className="p-4 hidden md:table-cell">Published</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  No posts yet. Soro webhook posts appear here automatically.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="border-t border-slate-100">
                  <td className="p-4 font-medium text-slate-900">{post.title}</td>
                  <td className="p-4 hidden sm:table-cell text-slate-500">{post.author}</td>
                  <td className="p-4 hidden md:table-cell text-slate-500">
                    {new Date(post.publishedAt).toLocaleDateString("en-GB")}
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/content/blog/${post.id}`} className="text-[#4C3BCF] text-xs font-medium hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
