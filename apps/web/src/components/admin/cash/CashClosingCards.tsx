import { ClipboardList, PiggyBank, ShoppingBag, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { DailyCashSummary, RangeCashSummary } from "@/lib/db/cash-ledger";

interface Props {
  summary: DailyCashSummary | RangeCashSummary;
  viewMode?: "day" | "period";
}

export function CashClosingCards({ summary, viewMode = "day" }: Props) {
  const periodSuffix = viewMode === "period" ? " (end of period)" : "";

  const cards = [
    {
      label: `Closing Cash In Hand${periodSuffix}`,
      value: formatPrice(String(summary.closingCash)),
      icon: PiggyBank,
      accent: "text-emerald-600",
    },
    {
      label: `Closing Online / Bank${periodSuffix}`,
      value: formatPrice(String(summary.closingOnline)),
      icon: Wallet,
      accent: "text-blue-600",
    },
    {
      label: `Total Business Funds${periodSuffix}`,
      value: formatPrice(String(summary.closingTotal)),
      icon: ShoppingBag,
      accent: "text-[#4C3BCF]",
    },
    {
      label: "Total Orders (Outstanding)",
      value: `${summary.outstandingOrders} · ${formatPrice(String(summary.outstandingBalance))}`,
      icon: ClipboardList,
      accent: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="boms-card p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">{card.label}</p>
              <p className={`text-xl font-semibold mt-2 ${card.accent}`}>{card.value}</p>
            </div>
            <card.icon className={`h-5 w-5 shrink-0 ${card.accent}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
