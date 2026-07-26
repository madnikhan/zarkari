"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function ShopSearchForm({
  initialQuery = "",
  variant = "page",
}: {
  initialQuery?: string;
  variant?: "page" | "header";
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  if (variant === "header") {
    return (
      <form onSubmit={submit} className="hidden md:flex items-center gap-2 max-w-xs">
        <label className="sr-only" htmlFor="header-search">
          Search products
        </label>
        <input
          id="header-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="w-40 lg:w-52 border border-sand bg-cream/40 px-3 py-1.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-gold"
        />
        <button type="submit" className="p-1.5 text-charcoal/60 hover:text-charcoal" aria-label="Search">
          <Search className="h-4 w-4" />
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="mb-10 flex gap-2 max-w-xl">
      <label className="sr-only" htmlFor="page-search">
        Search products
      </label>
      <input
        id="page-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, tag, or description"
        className="flex-1 border border-sand px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-gold"
        autoFocus
      />
      <button
        type="submit"
        className="px-6 py-3 bg-charcoal text-cream text-xs tracking-[0.2em] uppercase hover:bg-gold hover:text-charcoal transition-colors"
      >
        Search
      </button>
    </form>
  );
}
