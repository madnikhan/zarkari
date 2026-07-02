"use client";

import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { formatBusinessDate, shiftDate, todayDateString } from "@/lib/cash/labels";
import { useRouter } from "next/navigation";

interface Props {
  date: string;
  showPrint?: boolean;
}

export function CashDateNav({ date, showPrint = true }: Props) {
  const router = useRouter();
  const isToday = date === todayDateString();

  function go(next: string) {
    router.push(`/admin/cash?date=${next}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={() => go(shiftDate(date, -1))}
        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
        aria-label="Previous day"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium min-w-[180px] text-center">
        {formatBusinessDate(date)}
      </div>
      <button
        type="button"
        onClick={() => go(shiftDate(date, 1))}
        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
        aria-label="Next day"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      {!isToday && (
        <button
          type="button"
          onClick={() => go(todayDateString())}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          Today
        </button>
      )}
      {showPrint && (
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
      )}
    </div>
  );
}
