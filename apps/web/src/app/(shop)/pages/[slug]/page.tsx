import { notFound } from "next/navigation";
import { getPageBySlug, staticPages } from "@/lib/pages";
import { pageMetadata } from "@/lib/seo/site-metadata";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return staticPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) return { title: "Page" };
  return pageMetadata(page.title, page.description);
}

export default async function StaticPageView({ params }: Props) {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) notFound();

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl text-charcoal mb-8">{page.title}</h1>
        <div
          className="prose prose-neutral max-w-none prose-headings:font-display prose-a:text-gold"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </section>
  );
}
