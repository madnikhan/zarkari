import Link from "next/link";
import Image from "next/image";
import { getBlogPosts } from "@/lib/data";

export const metadata = {
  title: "Journal | ZARKARI",
  description: "Stories, style notes, and updates from ZARKARI.",
};

export default async function BlogIndexPage() {
  const posts = await getBlogPosts(50);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
      <h1 className="font-display text-3xl md:text-4xl text-charcoal mb-2">Journal</h1>
      <p className="text-charcoal/60 mb-10">Stories and updates from ZARKARI.</p>
      {posts.length === 0 ? (
        <p className="text-charcoal/50">No articles yet — check back soon.</p>
      ) : (
        <ul className="space-y-8">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/blog/${post.slug}`} className="group block sm:flex gap-6">
                {post.imageUrl && (
                  <div className="relative w-full sm:w-48 aspect-[4/3] flex-shrink-0 bg-sand/30 overflow-hidden mb-4 sm:mb-0">
                    <Image src={post.imageUrl} alt="" fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform" />
                  </div>
                )}
                <div>
                  <time className="text-xs text-charcoal/50 uppercase tracking-wide">
                    {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </time>
                  <h2 className="font-display text-xl text-charcoal mt-1 group-hover:text-gold transition-colors">{post.title}</h2>
                  {post.excerpt && <p className="text-sm text-charcoal/70 mt-2 line-clamp-2">{post.excerpt}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
