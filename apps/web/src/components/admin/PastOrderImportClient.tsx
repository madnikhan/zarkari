"use client";

import { useState } from "react";
import Link from "next/link";

type PreviewResult = {
  row: number;
  ok: boolean;
  error?: string;
  data?: { orderNumber?: string; customerName: string };
};

export function PastOrderImportClient() {
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<{
    validCount: number;
    errorCount: number;
    results: PreviewResult[];
  } | null>(null);
  const [commitResult, setCommitResult] = useState<{
    createdCount: number;
    failedCount: number;
    created: { row: number; orderNumber: string }[];
    failed: { row: number; error: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    setPreview(null);
    setCommitResult(null);
  }

  async function runPreview() {
    setLoading(true);
    setError("");
    setCommitResult(null);
    try {
      const res = await fetch("/api/orders/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, dryRun: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Validation failed");
      setPreview({
        validCount: data.validCount,
        errorCount: data.errorCount,
        results: data.results ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function runCommit() {
    if (!confirm(`Import ${preview?.validCount ?? 0} past orders? This cannot be undone easily.`)) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, dryRun: false, commit: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setCommitResult({
        createdCount: data.createdCount,
        failedCount: data.failedCount,
        created: data.created ?? [],
        failed: data.failed ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap gap-3">
        <a
          href="/api/orders/import"
          className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          Download CSV template
        </a>
        <Link href="/admin/orders/past/new" className="px-4 py-2 text-sm text-[#4C3BCF] hover:underline">
          Single past order form
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <p className="text-sm text-slate-500">
          Upload a CSV of historical bridal orders. Valid rows create past orders (no cash ledger /
          WhatsApp). Max 500 rows per upload.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
          className="block text-sm"
        />
        <textarea
          value={csv}
          onChange={(e) => {
            setCsv(e.target.value);
            setPreview(null);
            setCommitResult(null);
          }}
          rows={10}
          placeholder="Paste CSV here or choose a file…"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono"
        />
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={loading || !csv.trim()}
            onClick={() => void runPreview()}
            className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40"
          >
            {loading ? "Working…" : "Validate"}
          </button>
          <button
            type="button"
            disabled={loading || !preview || preview.validCount === 0}
            onClick={() => void runCommit()}
            className="boms-btn-primary px-4 py-2 text-sm rounded-lg disabled:opacity-40"
          >
            Import {preview?.validCount ?? 0} valid rows
          </button>
        </div>
      </div>

      {preview && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-2">Validation</h2>
          <p className="text-sm text-slate-600 mb-3">
            {preview.validCount} valid · {preview.errorCount} errors
          </p>
          <ul className="max-h-64 overflow-y-auto text-xs space-y-1">
            {preview.results
              .filter((r) => r.row > 0)
              .map((r) => (
                <li key={r.row} className={r.ok ? "text-emerald-700" : "text-red-600"}>
                  Row {r.row}:{" "}
                  {r.ok
                    ? `OK — ${r.data?.customerName}${r.data?.orderNumber ? ` (${r.data.orderNumber})` : ""}`
                    : r.error}
                </li>
              ))}
          </ul>
        </div>
      )}

      {commitResult && (
        <div className="bg-white border border-emerald-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-2">Import complete</h2>
          <p className="text-sm text-slate-600 mb-3">
            Created {commitResult.createdCount} · Failed {commitResult.failedCount}
          </p>
          {commitResult.failed.length > 0 && (
            <ul className="text-xs text-red-600 space-y-1 mb-3">
              {commitResult.failed.map((f) => (
                <li key={f.row}>
                  Row {f.row}: {f.error}
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/orders?type=custom&tab=completed" className="text-sm text-[#4C3BCF] hover:underline">
            View completed custom orders →
          </Link>
        </div>
      )}
    </div>
  );
}
