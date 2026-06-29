"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BlogPost } from "@/lib/data/seed";

export function BlogPostEditor({ post }: { post: BlogPost }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    contentHtml: post.contentHtml,
    imageUrl: post.imageUrl ?? "",
    author: post.author,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/blog/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      router.push("/admin/content/blog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const isSoro = post.author.toLowerCase().includes("soro");

  return (
    <form onSubmit={submit} className="boms-card p-6 space-y-4 max-w-2xl">
      {isSoro && (
        <p className="text-xs bg-violet-50 text-violet-700 px-3 py-2 rounded-lg">
          Published via Soro — edits here override the stored article.
        </p>
      )}
      {(["title", "slug", "excerpt", "imageUrl", "author"] as const).map((key) => (
        <div key={key}>
          <label className="text-xs text-slate-500 uppercase">{key}</label>
          <input
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      ))}
      <div>
        <label className="text-xs text-slate-500 uppercase">Content HTML</label>
        <textarea
          value={form.contentHtml}
          onChange={(e) => setForm({ ...form, contentHtml: e.target.value })}
          rows={12}
          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-xs"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="boms-btn-primary px-5 py-2 rounded-lg text-sm">
          {loading ? "Saving…" : "Save"}
        </button>
        <Link href="/admin/content/blog" className="px-5 py-2 text-sm text-slate-600">
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function NewBlogPostForm({ isOwner = true }: { isOwner?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", contentHtml: "<p></p>", imageUrl: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Publish failed");
      }
      router.push("/admin/content/blog");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setLoading(false);
    }
  }

  if (!isOwner) return null;

  return (
    <form onSubmit={submit} className="boms-card p-6 space-y-4">
      <h2 className="font-semibold text-slate-900">New blog post</h2>
      {(["title", "slug", "excerpt", "imageUrl"] as const).map((key) => (
        <input
          key={key}
          placeholder={key}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          required={key === "title"}
        />
      ))}
      <textarea
        value={form.contentHtml}
        onChange={(e) => setForm({ ...form, contentHtml: e.target.value })}
        rows={6}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-xs"
      />
      <button type="submit" disabled={loading} className="boms-btn-primary px-5 py-2 rounded-lg text-sm">
        {loading ? "Publishing…" : "Publish"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
