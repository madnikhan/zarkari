import { unstable_cache } from "next/cache";

const FALLBACK_GBP_PKR = 355;

async function fetchLiveGbpPkrRate(): Promise<number> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=GBP&to=PKR", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("FX API unavailable");
    const data = (await res.json()) as { rates?: { PKR?: number } };
    const rate = data.rates?.PKR;
    if (!rate || rate <= 0) throw new Error("Invalid rate");
    return rate;
  } catch {
    return FALLBACK_GBP_PKR;
  }
}

export const getGbpPkrRate = unstable_cache(fetchLiveGbpPkrRate, ["gbp-pkr-rate"], {
  revalidate: 3600,
});

export function convertGbpToPkr(gbp: number, rate: number): number {
  return Math.round(gbp * rate * 100) / 100;
}

export function convertPkrToGbp(pkr: number, rate: number): number {
  if (!rate) return 0;
  return Math.round((pkr / rate) * 100) / 100;
}
