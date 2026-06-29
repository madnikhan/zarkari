import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createBlogPostDb } from "@/lib/db/cms-blog";
import { isDbConfigured } from "@/lib/db";
import { demoBlogPosts } from "@/lib/data/seed";

const SORO_SECRET = process.env.SORO_WEBHOOK_SECRET?.trim();

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && !SORO_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (SORO_SECRET && auth !== `Bearer ${SORO_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const slug = body.slug ?? body.title?.toLowerCase().replace(/\s+/g, "-") ?? `post-${Date.now()}`;

  if (isDbConfigured()) {
    const post = await createBlogPostDb({
      slug,
      title: body.title ?? "Untitled",
      excerpt: body.excerpt ?? body.summary,
      contentHtml: body.contentHtml ?? body.content ?? "<p></p>",
      imageUrl: body.imageUrl ?? body.coverImage,
      author: body.author ?? "Soro",
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      published: body.published !== false,
    });
    if (post) {
      revalidatePath("/blog");
      revalidatePath(`/blog/${post.slug}`);
      return NextResponse.json({ ok: true, slug: post.slug, id: post.id });
    }
  }

  const post = {
    id: `blog-${Date.now()}`,
    slug,
    title: body.title ?? "Untitled",
    excerpt: body.excerpt ?? body.summary,
    contentHtml: body.contentHtml ?? body.content ?? "<p></p>",
    imageUrl: body.imageUrl ?? body.coverImage,
    publishedAt: body.publishedAt ?? new Date().toISOString(),
    author: body.author ?? "Soro",
  };

  demoBlogPosts.unshift(post);
  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  return NextResponse.json({ ok: true, slug: post.slug });
}
