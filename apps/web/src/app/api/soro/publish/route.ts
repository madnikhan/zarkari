import { NextResponse } from "next/server";
import { demoBlogPosts } from "@/lib/data/seed";

const SORO_SECRET = process.env.SORO_WEBHOOK_SECRET?.trim();

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (SORO_SECRET && auth !== `Bearer ${SORO_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const post = {
    id: `blog-${Date.now()}`,
    slug: body.slug ?? body.title?.toLowerCase().replace(/\s+/g, "-") ?? `post-${Date.now()}`,
    title: body.title ?? "Untitled",
    excerpt: body.excerpt ?? body.summary,
    contentHtml: body.contentHtml ?? body.content ?? "<p></p>",
    imageUrl: body.imageUrl ?? body.coverImage,
    publishedAt: body.publishedAt ?? new Date().toISOString(),
    author: body.author ?? "ZARKARI",
  };

  demoBlogPosts.unshift(post);
  return NextResponse.json({ ok: true, slug: post.slug });
}
