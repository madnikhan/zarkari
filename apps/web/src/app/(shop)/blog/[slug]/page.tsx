import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Not found" };
  return {
    title: `${post.title} | ZARKARI`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
      <Link href="/blog" className="text-xs text-charcoal/50 hover:text-charcoal uppercase tracking-wide">
        ← Journal
      </Link>
      <header className="mt-4 mb-8">
        <time className="text-xs text-charcoal/50 uppercase tracking-wide">
          {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </time>
        <h1 className="font-display text-3xl md:text-4xl text-charcoal mt-2">{post.title}</h1>
        {post.author && <p className="text-sm text-charcoal/50 mt-2">By {post.author}</p>}
      </header>
      {post.imageUrl && (
        <div className="relative aspect-[16/9] mb-8 bg-sand/30 overflow-hidden">
          <Image src={post.imageUrl} alt="" fill sizes="800px" className="object-cover" priority />
        </div>
      )}
      <div className="prose prose-charcoal max-w-none" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </article>
  );
}
