import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { listBlogPostsDb, createBlogPostDb } from "@/lib/db/cms-blog";
import { isDbConfigured } from "@/lib/db";
import { demoBlogPosts } from "@/lib/data/seed";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isDbConfigured()) {
    const posts = await listBlogPostsDb(100, false);
    return NextResponse.json({ posts });
  }
  return NextResponse.json({ posts: demoBlogPosts });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const body = await request.json();
  const slug = body.slug ?? body.title?.toLowerCase().replace(/\s+/g, "-");

  if (isDbConfigured()) {
    const post = await createBlogPostDb({
      slug,
      title: body.title,
      excerpt: body.excerpt,
      contentHtml: body.contentHtml ?? "<p></p>",
      imageUrl: body.imageUrl,
      author: body.author ?? session.name,
      published: body.published !== false,
    });
    if (post) {
      revalidatePath("/blog");
      return NextResponse.json({ post });
    }
  }

  const post = {
    id: `blog-${Date.now()}`,
    slug,
    title: body.title,
    excerpt: body.excerpt,
    contentHtml: body.contentHtml ?? "<p></p>",
    imageUrl: body.imageUrl,
    publishedAt: new Date().toISOString(),
    author: body.author ?? session.name ?? "ZARKARI",
  };
  demoBlogPosts.unshift(post);
  revalidatePath("/blog");
  return NextResponse.json({ post });
}
