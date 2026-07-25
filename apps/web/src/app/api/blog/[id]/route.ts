import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { canDeleteRecords, getSession } from "@/lib/auth/session";
import { deleteBlogPostDb, getBlogPostByIdDb, updateBlogPostDb } from "@/lib/db/cms-blog";
import { isDbConfigured } from "@/lib/db";
import { demoBlogPosts } from "@/lib/data/seed";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (isDbConfigured()) {
    const post = await getBlogPostByIdDb(id);
    if (post) return NextResponse.json({ post });
  }
  const post = demoBlogPosts.find((p) => p.id === id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  if (isDbConfigured()) {
    const post = await updateBlogPostDb(id, body);
    if (post) {
      revalidatePath("/blog");
      revalidatePath(`/blog/${post.slug}`);
      return NextResponse.json({ post });
    }
  }

  const idx = demoBlogPosts.findIndex((p) => p.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  Object.assign(demoBlogPosts[idx], body);
  revalidatePath("/blog");
  return NextResponse.json({ post: demoBlogPosts[idx] });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !canDeleteRecords(session.role)) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { id } = await params;

  if (isDbConfigured()) {
    const existing = await getBlogPostByIdDb(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const ok = await deleteBlogPostDb(id);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    revalidatePath("/blog");
    revalidatePath(`/blog/${existing.slug}`);
    revalidatePath("/admin/content/blog");
    return NextResponse.json({ ok: true });
  }

  const idx = demoBlogPosts.findIndex((p) => p.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [removed] = demoBlogPosts.splice(idx, 1);
  revalidatePath("/blog");
  revalidatePath(`/blog/${removed.slug}`);
  revalidatePath("/admin/content/blog");
  return NextResponse.json({ ok: true });
}
