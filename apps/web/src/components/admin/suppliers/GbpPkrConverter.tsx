"use client";

import { useEffect, useState } from "react";

interface Props {
  amountGbp: string;
  amountPkr: string;
  exchangeRate: string;
  onGbpChange: (v: string) => void;
  onPkrChange: (v: string) => void;
  onRateChange: (v: string) => void;
}

export function GbpPkrConverter({
  amountGbp,
  amountPkr,
  exchangeRate,
  onGbpChange,
  onPkrChange,
  onRateChange,
}: Props) {
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [lastEdited, setLastEdited] = useState<"gbp" | "pkr" | null>(null);

  useEffect(() => {
    fetch("/api/fx/gbp-pkr")
      .then((r) => r.json())
      .then((d) => {
        const rate = Number(d.rate);
        if (rate > 0) {
          setLiveRate(rate);
        }
      })
      .catch(() => setLiveRate(null));
  }, []);

  function handleGbpChange(v: string) {
    setLastEdited("gbp");
    onGbpChange(v);
    const rate = parseFloat(exchangeRate);
    const gbp = parseFloat(v);
    if (rate > 0 && !Number.isNaN(gbp)) {
      onPkrChange(String(Math.round(gbp * rate * 100) / 100));
    }
  }

  function handlePkrChange(v: string) {
    setLastEdited("pkr");
    onPkrChange(v);
    const rate = parseFloat(exchangeRate);
    const pkr = parseFloat(v);
    if (rate > 0 && !Number.isNaN(pkr)) {
      onGbpChange(String(Math.round((pkr / rate) * 100) / 100));
    }
  }

  function handleRateChange(v: string) {
    onRateChange(v);
    const rate = parseFloat(v);
    if (!(rate > 0)) return;
    if (lastEdited === "pkr") {
      const pkr = parseFloat(amountPkr);
      if (!Number.isNaN(pkr)) onGbpChange(String(Math.round((pkr / rate) * 100) / 100));
    } else {
      const gbp = parseFloat(amountGbp);
      if (!Number.isNaN(gbp)) onPkrChange(String(Math.round(gbp * rate * 100) / 100));
    }
  }

  function useLiveRate() {
    if (liveRate) {
      onRateChange(String(liveRate));
      handleRateChange(String(liveRate));
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase text-slate-500">GBP ↔ PKR Converter</p>
        {liveRate && (
          <button type="button" onClick={useLiveRate} className="text-xs text-[#4C3BCF] hover:underline">
            Use live rate ({liveRate.toFixed(2)})
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-slate-500">GBP (£)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amountGbp}
            onChange={(e) => handleGbpChange(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Rate (1 GBP)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={exchangeRate}
            onChange={(e) => handleRateChange(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">PKR (Rs)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amountPkr}
            onChange={(e) => handlePkrChange(e.target.value)}
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
