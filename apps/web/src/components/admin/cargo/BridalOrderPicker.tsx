"use client";

import { useEffect, useRef, useState } from "react";

interface OrderResult {
  id: string;
  orderNumber: string;
  customerName?: string;
}

interface Props {
  value: OrderResult | null;
  onChange: (order: OrderResult | null) => void;
  disabled?: boolean;
}

export function BridalOrderPicker({ value, onChange, disabled }: Props) {
  const [query, setQuery] = useState(value?.orderNumber ?? "");
  const [results, setResults] = useState<OrderResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value?.orderNumber ?? "");
  }, [value?.orderNumber]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function search(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      if (!q.trim()) onChange(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      const list = (data.results ?? []).map((o: OrderResult) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
      }));
      setResults(list);
      setOpen(list.length > 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function pick(order: OrderResult) {
    onChange(order);
    setQuery(order.orderNumber);
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex gap-1">
        <input
          type="text"
          value={query}
          disabled={disabled}
          onChange={(e) => void search(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder="Search ORD-xxx…"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
        />
        {value && !disabled && (
          <button type="button" onClick={clear} className="text-xs text-slate-400 hover:text-red-600 px-2">
            Clear
          </button>
        )}
      </div>
      {loading && <p className="text-[10px] text-slate-400 mt-1">Searching…</p>}
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {results.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => pick(o)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
              >
                <span className="font-mono text-[#4C3BCF]">{o.orderNumber}</span>
                {o.customerName && <span className="text-slate-500 ml-2">{o.customerName}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
