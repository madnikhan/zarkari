"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Collection } from "@/lib/data/seed";
import { ImageField } from "@/components/admin/content/ImageField";

export function CollectionsManager({ initial, isOwner = true }: { initial: Collection[]; isOwner?: boolean }) {
  const router = useRouter();
  const [collections, setCollections] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ handle: "", title: "", description: "", imageUrl: "" });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      setCollections([...collections, data.collection]);
      setForm({ handle: "", title: "", description: "", imageUrl: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  }

  async function save(col: Collection) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/collections/${col.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(col),
      });
      if (!res.ok) throw new Error("Failed to save");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this collection?")) return;
    setError("");
    const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete collection");
      return;
    }
    setCollections(collections.filter((c) => c.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {isOwner && (
        <form onSubmit={create} className="boms-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">New collection</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              placeholder="handle"
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          <ImageField
            label="Hero image"
            value={form.imageUrl}
            onChange={(imageUrl) => setForm({ ...form, imageUrl })}
          />
          <button type="submit" disabled={loading} className="boms-btn-primary px-4 py-2 rounded-lg text-sm">
            Add collection
          </button>
        </form>
      )}
      <div className="space-y-4">
        {collections.map((col) => (
          <div key={col.id} className="boms-card p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={col.handle}
                onChange={(e) => setCollections(collections.map((c) => (c.id === col.id ? { ...c, handle: e.target.value } : c)))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
              />
              <input
                value={col.title}
                onChange={(e) => setCollections(collections.map((c) => (c.id === col.id ? { ...c, title: e.target.value } : c)))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <input
              value={col.description ?? ""}
              onChange={(e) => setCollections(collections.map((c) => (c.id === col.id ? { ...c, description: e.target.value } : c)))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Description"
            />
            <ImageField
              label="Hero image"
              value={col.imageUrl ?? ""}
              onChange={(imageUrl) =>
                setCollections(collections.map((c) => (c.id === col.id ? { ...c, imageUrl } : c)))
              }
            />
            <div className="flex gap-2">
              {isOwner && (
                <>
                  <button type="button" onClick={() => save(col)} disabled={loading} className="boms-btn-primary px-4 py-2 rounded-lg text-sm">
                    Save
                  </button>
                  <button type="button" onClick={() => remove(col.id)} className="px-4 py-2 rounded-lg text-sm text-red-600 border border-red-200">
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
