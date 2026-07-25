import {
  parseCashPeriodPreset,
  resolvePeriodBounds,
  type CashPeriodPreset,
} from "@/lib/cash/labels";

/** Resolve from/to/preset search params into inclusive date bounds (server-safe). */
export function resolveSearchDateBounds(params: {
  from?: string;
  to?: string;
  preset?: string;
}): { from?: string; to?: string; preset?: CashPeriodPreset } {
  const from = params.from?.slice(0, 10);
  const to = params.to?.slice(0, 10);
  if (from && to) {
    return {
      from: from <= to ? from : to,
      to: from <= to ? to : from,
      preset: "custom",
    };
  }
  const preset = params.preset ? parseCashPeriodPreset(params.preset) : undefined;
  if (preset && preset !== "custom" && params.preset) {
    const bounds = resolvePeriodBounds(preset);
    return { from: bounds.start, to: bounds.end, preset };
  }
  return {};
}

/** End of day ISO for inclusive `to` date filters on timestamps. */
export function endOfDayIso(dateYmd: string): string {
  return `${dateYmd.slice(0, 10)}T23:59:59.999Z`;
}

export function startOfDayIso(dateYmd: string): string {
  return `${dateYmd.slice(0, 10)}T00:00:00.000Z`;
}

/** Pass-through for pagination / tab links so from/to/preset survive navigation. */
export function dateSearchQuery(params: {
  from?: string;
  to?: string;
  preset?: string;
}): Record<string, string | undefined> {
  return {
    from: params.from || undefined,
    to: params.to || undefined,
    preset: params.preset || undefined,
  };
}
