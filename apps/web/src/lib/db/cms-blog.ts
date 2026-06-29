import { desc, eq } from "drizzle-orm";
import type { BlogPost } from "@/lib/data/seed";
import { getDb, schema } from "./index";

function mapPost(row: typeof schema.blogPosts.$inferSelect): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? undefined,
    contentHtml: row.contentHtml,
    imageUrl: row.imageUrl ?? undefined,
    publishedAt: row.publishedAt.toISOString(),
    author: row.author ?? "ZARKARI",
  };
}

export async function listBlogPostsDb(limit = 50, publishedOnly = true): Promise<BlogPost[]> {
  const db = getDb();
  if (!db) return [];
  const rows = publishedOnly
    ? await db
        .select()
        .from(schema.blogPosts)
        .where(eq(schema.blogPosts.published, true))
        .orderBy(desc(schema.blogPosts.publishedAt))
        .limit(limit)
    : await db.select().from(schema.blogPosts).orderBy(desc(schema.blogPosts.publishedAt)).limit(limit);
  return rows.map(mapPost);
}

export async function getBlogPostBySlugDb(slug: string): Promise<BlogPost | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.slug, slug)).limit(1);
  return row ? mapPost(row) : null;
}

export async function getBlogPostByIdDb(id: string): Promise<BlogPost | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, id)).limit(1);
  return row ? mapPost(row) : null;
}

export async function createBlogPostDb(input: {
  slug: string;
  title: string;
  excerpt?: string;
  contentHtml: string;
  imageUrl?: string;
  author?: string;
  metaTitle?: string;
  metaDescription?: string;
  published?: boolean;
}): Promise<BlogPost | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .insert(schema.blogPosts)
    .values({
      slug: input.slug,
      title: input.title,
      excerpt: input.excerpt ?? null,
      contentHtml: input.contentHtml,
      imageUrl: input.imageUrl ?? null,
      author: input.author ?? "ZARKARI",
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
      published: input.published ?? true,
    })
    .returning();
  return mapPost(row);
}

export async function updateBlogPostDb(
  id: string,
  input: Partial<{
    slug: string;
    title: string;
    excerpt: string;
    contentHtml: string;
    imageUrl: string;
    author: string;
    published: boolean;
  }>
): Promise<BlogPost | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db.update(schema.blogPosts).set(input).where(eq(schema.blogPosts.id, id)).returning();
  return row ? mapPost(row) : null;
}

export async function countBlogPostsDb(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const rows = await db.select().from(schema.blogPosts);
  return rows.length;
}
