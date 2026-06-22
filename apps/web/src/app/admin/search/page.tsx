"use client";

import { useState } from "react";
import Link from "next/link";
import type { BridalOrder } from "@/lib/data/seed";

export default function AdminSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(BridalOrder & { customerName?: string })[]>([]);
  const [searched, setSearched] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/orders/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setSearched(true);
  }

  return (
    <div className="p-6 lg:p-10 max-w-2xl">
      <h1 className="font-display text-3xl text-charcoal mb-8">Search Orders</h1>
      <form onSubmit={search} className="flex gap-2 mb-8">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Order number, name, phone, status..."
          className="flex-1 border border-sand rounded px-4 py-2 text-sm"
        />
        <button type="submit" className="px-5 py-2 bg-charcoal text-cream text-xs uppercase tracking-wide rounded">
          Search
        </button>
      </form>
      {searched && (
        <ul className="space-y-3">
          {results.length ? results.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className="block bg-white border border-sand rounded p-4 hover:border-gold/50">
                <span className="font-mono text-sm">{o.orderNumber}</span>
                <span className="text-charcoal/60 text-sm ml-3">{o.customerName}</span>
              </Link>
            </li>
          )) : (
            <p className="text-charcoal/50 text-sm">No results.</p>
          )}
        </ul>
      )}
    </div>
  );
}
