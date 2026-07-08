"use client";

import { useEffect } from "react";

export function PrintCargoBoxClient() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="print:hidden mb-6 flex gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="px-4 py-2 text-sm boms-btn-primary rounded-lg"
      >
        Print / Save PDF
      </button>
      <button type="button" onClick={() => window.close()} className="px-4 py-2 text-sm border border-slate-200 rounded-lg">
        Close
      </button>
    </div>
  );
}
