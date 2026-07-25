"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  parseCashPeriodPreset,
  resolvePeriodBounds,
  todayDateString,
  type CashPeriodPreset,
} from "@/lib/cash/labels";

const PRESETS: { id: CashPeriodPreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
];

interface Props {
  /** Query keys to preserve when updating dates (e.g. tab, type, q). */
  preserveKeys?: string[];
  className?: string;
}

function buildHref(
  pathname: string,
  searchParams: URLSearchParams,
  preserveKeys: string[],
  patch: Record<string, string | null>
): string {
  const next = new URLSearchParams();
  for (const key of preserveKeys) {
    const v = searchParams.get(key);
    if (v) next.set(key, v);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "") next.delete(k);
    else next.set(k, v);
  }
  const qs = next.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function AdminDateRangeFilter({ preserveKeys = [], className = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  const presetParam = searchParams.get("preset") ?? "";

  const activePreset: CashPeriodPreset | "custom" | null = fromParam && toParam
    ? "custom"
    : presetParam
      ? parseCashPeriodPreset(presetParam)
      : null;

  const [customFrom, setCustomFrom] = useState(fromParam || todayDateString());
  const [customTo, setCustomTo] = useState(toParam || todayDateString());
  const [showCustom, setShowCustom] = useState(activePreset === "custom" || (!!fromParam && !!toParam));

  function goPreset(preset: CashPeriodPreset) {
    setShowCustom(false);
    router.push(
      buildHref(pathname, searchParams, preserveKeys, {
        preset,
        from: null,
        to: null,
        period: null,
      })
    );
  }

  function applyCustom() {
    if (!customFrom || !customTo) return;
    const start = customFrom <= customTo ? customFrom : customTo;
    const end = customFrom <= customTo ? customTo : customFrom;
    router.push(
      buildHref(pathname, searchParams, preserveKeys, {
        from: start,
        to: end,
        preset: null,
        period: null,
      })
    );
  }

  function clearRange() {
    setShowCustom(false);
    router.push(
      buildHref(pathname, searchParams, preserveKeys, {
        from: null,
        to: null,
        preset: null,
      })
    );
  }

  const boundsLabel =
    fromParam && toParam
      ? resolvePeriodBounds("custom", fromParam, toParam).label
      : activePreset && activePreset !== "custom"
        ? resolvePeriodBounds(activePreset).label
        : null;

  return (
    <div className={`space-y-2 print:hidden ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => goPreset(p.id)}
            className={`px-3 py-1.5 text-xs uppercase tracking-wide rounded border ${
              activePreset === p.id
                ? "bg-charcoal text-cream border-charcoal"
                : "border-sand hover:bg-sand/30"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowCustom(true)}
          className={`px-3 py-1.5 text-xs uppercase tracking-wide rounded border ${
            showCustom || activePreset === "custom"
              ? "bg-charcoal text-cream border-charcoal"
              : "border-sand hover:bg-sand/30"
          }`}
        >
          Custom
        </button>
        {(fromParam || toParam || presetParam) && (
          <button
            type="button"
            onClick={clearRange}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
          >
            Clear
          </button>
        )}
      </div>
      {showCustom && (
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="text-[10px] uppercase text-slate-400">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="mt-0.5 block border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-slate-400">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="mt-0.5 block border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={applyCustom}
            className="boms-btn-primary px-3 py-1.5 rounded-lg text-xs font-medium"
          >
            Apply
          </button>
        </div>
      )}
      {boundsLabel && (
        <p className="text-xs text-slate-500">{boundsLabel}</p>
      )}
    </div>
  );
}
