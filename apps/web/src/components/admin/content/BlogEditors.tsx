"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BlogPost } from "@/lib/data/seed";
import { ImageField } from "@/components/admin/content/ImageField";

export function BlogPostEditor({
  post,
  isOwner = true,
}: {
  post: BlogPost;
  isOwner?: boolean;
}) {
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

  async function remove() {
    if (!confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/blog/${post.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      router.push("/admin/content/blog");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
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
      {(["title", "slug", "excerpt", "author"] as const).map((key) => (
        <div key={key}>
          <label className="text-xs text-slate-500 uppercase">{key}</label>
          <input
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            disabled={!isOwner}
          />
        </div>
      ))}
      <ImageField
        label="Cover image"
        value={form.imageUrl}
        onChange={(imageUrl) => setForm({ ...form, imageUrl })}
      />
      <div>
        <label className="text-xs text-slate-500 uppercase">Content HTML</label>
        <textarea
          value={form.contentHtml}
          onChange={(e) => setForm({ ...form, contentHtml: e.target.value })}
          rows={12}
          className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-xs"
          disabled={!isOwner}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading || !isOwner}
          className="boms-btn-primary px-5 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
        <Link href="/admin/content/blog" className="px-5 py-2 text-sm text-slate-600">
          Cancel
        </Link>
        {isOwner && (
          <button
            type="button"
            onClick={() => void remove()}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-sm text-red-600 border border-red-200 disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

export function DeleteBlogPostButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm(`Delete “${title}”? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void remove()}
      disabled={loading}
      className="text-red-600 text-xs font-medium hover:underline disabled:opacity-50 ml-3"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
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
      {(["title", "slug", "excerpt"] as const).map((key) => (
        <input
          key={key}
          placeholder={key}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          required={key === "title"}
        />
      ))}
      <ImageField
        label="Cover image"
        value={form.imageUrl}
        onChange={(imageUrl) => setForm({ ...form, imageUrl })}
      />
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
