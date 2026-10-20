import { Banknote, Landmark, Scale } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { DailyCashSummary, RangeCashSummary } from "@/lib/db/cash-ledger";

interface Props {
  summary: DailyCashSummary | RangeCashSummary;
  viewMode?: "day" | "period";
}

export function CashSummaryCards({ summary }: Props) {
  const cards = [
    {
      label: "Total Cash",
      value: formatPrice(String(summary.closingCash)),
      sub: "Cash in hand",
      icon: Banknote,
      accent: "text-emerald-600",
    },
    {
      label: "Total Bank",
      value: formatPrice(String(summary.closingOnline)),
      sub: "Card / online / bank",
      icon: Landmark,
      accent: "text-[#4C3BCF]",
    },
    {
      label: "Grand Total",
      value: formatPrice(String(summary.closingTotal)),
      sub: "Cash + bank",
      icon: Scale,
      accent: "text-slate-900",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-tour="cash-summary">
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
