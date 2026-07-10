"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import type { UnifiedOrder } from "@/lib/db/unified-orders";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState<UnifiedOrder[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results ?? []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQ.trim()) {
      setQuery(initialQ);
      runSearch(initialQ);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    await runSearch(query);
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Search Orders</h1>
      <form onSubmit={search} className="flex gap-2 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Order number, name, phone, status..."
          className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="boms-btn-primary px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
      {searched && (
        <ul className="space-y-3">
          {results.length ? (
            results.map((o) => (
              <li key={`${o.type}-${o.id}`}>
                <Link
                  href={o.href}
                  className="block boms-card p-4 hover:border-[#4C3BCF]/30 transition-colors"
                >
                  <span className="font-mono text-sm text-[#4C3BCF]">{o.orderNumber}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-400 ml-2">{o.type}</span>
                  <span className="text-slate-600 text-sm ml-3">{o.customerLabel}</span>
                </Link>
              </li>
            ))
          ) : (
            <p className="text-slate-500 text-sm">No results.</p>
          )}
        </ul>
      )}
    </div>
  );
}

export default function AdminSearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500 text-sm">Loading search…</div>}>
      <SearchContent />
    </Suspense>
  );
}
