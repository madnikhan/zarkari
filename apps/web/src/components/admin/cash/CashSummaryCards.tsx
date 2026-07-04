import { Wallet, ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { DailyCashSummary, RangeCashSummary } from "@/lib/db/cash-ledger";

interface Props {
  summary: DailyCashSummary | RangeCashSummary;
  viewMode?: "day" | "period";
}

function isRangeSummary(summary: DailyCashSummary | RangeCashSummary): summary is RangeCashSummary {
  return "netPeriod" in summary;
}

export function CashSummaryCards({ summary, viewMode = "day" }: Props) {
  const netLabel = viewMode === "period" || isRangeSummary(summary) ? "Net Balance (Period)" : "Net Balance (Today)";
  const netValue = isRangeSummary(summary) ? summary.netPeriod : summary.netToday;

  const cards = [
    {
      label: "Opening Balance",
      value: formatPrice(String(summary.openingTotal)),
      sub: `Cash ${formatPrice(String(summary.openingCash))} · Online ${formatPrice(String(summary.openingOnline))}`,
      icon: Wallet,
      accent: "text-slate-900",
    },
    {
      label: "Total Cash In",
      value: formatPrice(String(summary.totalCashIn)),
      icon: ArrowDownLeft,
      accent: "text-emerald-600",
    },
    {
      label: "Total Cash Out",
      value: formatPrice(String(summary.totalCashOut)),
      icon: ArrowUpRight,
      accent: "text-red-600",
    },
    {
      label: netLabel,
      value: formatPrice(String(netValue)),
      icon: Scale,
      accent: "text-[#4C3BCF]",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="boms-card p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">{card.label}</p>
              <p className={`text-2xl font-semibold mt-2 ${card.accent}`}>{card.value}</p>
              {card.sub && <p className="text-xs text-slate-400 mt-1">{card.sub}</p>}
            </div>
            <card.icon className={`h-5 w-5 shrink-0 ${card.accent}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
