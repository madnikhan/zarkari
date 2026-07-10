"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  buildHref: (page: number) => string;
  className?: string;
}

function pageWindow(current: number, total: number): number[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  buildHref,
  className = "",
}: Props) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);
  const btn =
    "px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-center gap-3 mt-6", className)}>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {page > 1 ? (
          <Link href={buildHref(1)} className={btn}>
            First
          </Link>
        ) : (
          <span className={cn(btn, "opacity-40")}>First</span>
        )}
        {page > 1 ? (
          <Link href={buildHref(page - 1)} className={btn}>
            Prev
          </Link>
        ) : (
          <span className={cn(btn, "opacity-40")}>Prev</span>
        )}
        {pages.map((p, i) => {
          const prev = pages[i - 1];
          const gap = prev !== undefined && p - prev > 1;
          return (
            <span key={p} className="flex items-center gap-1">
              {gap && <span className="px-1 text-slate-400">…</span>}
              <Link
                href={buildHref(p)}
                className={cn(
                  btn,
                  p === page && "bg-[#4C3BCF] text-white border-[#4C3BCF] hover:bg-[#4C3BCF]"
                )}
              >
                {p}
              </Link>
            </span>
          );
        })}
        {page < totalPages ? (
          <Link href={buildHref(page + 1)} className={btn}>
            Next
          </Link>
        ) : (
          <span className={cn(btn, "opacity-40")}>Next</span>
        )}
        {page < totalPages ? (
          <Link href={buildHref(totalPages)} className={btn}>
            Last
          </Link>
        ) : (
          <span className={cn(btn, "opacity-40")}>Last</span>
        )}
      </div>
      <p className="text-sm text-slate-500">
        Page {page} of {totalPages}
        {totalItems !== undefined && (
          <>
            {" "}
            ({totalItems} item{totalItems === 1 ? "" : "s"}
            {pageSize ? `, ${pageSize}/page` : ""})
          </>
        )}
      </p>
    </div>
  );
}
