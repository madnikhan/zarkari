import { formatPrice } from "@/lib/utils";
import { CASH_TYPE_LABELS } from "@/lib/cash/labels";
import type { CashTransaction } from "@/lib/db/cash-ledger";

interface Props {
  title: string;
  accent: "in" | "out";
  transactions: CashTransaction[];
  total: number;
}

export function CashTransactionTable({ title, accent, transactions, total }: Props) {
  const headerClass =
    accent === "in"
      ? "bg-emerald-50 text-emerald-800 border-emerald-100"
      : "bg-red-50 text-red-800 border-red-100";

  return (
    <div className="boms-card overflow-hidden flex flex-col min-h-[320px]">
      <div className={`px-4 py-3 border-b font-semibold text-sm ${headerClass}`}>{title}</div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500">
              <th className="text-left px-3 py-2 font-medium">Time</th>
              <th className="text-left px-3 py-2 font-medium">Type</th>
              <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Ref</th>
              <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Description</th>
              <th className="text-left px-3 py-2 font-medium">Method</th>
              <th className="text-right px-3 py-2 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                  No transactions yet
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(tx.occurredAt).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-3 py-2">{CASH_TYPE_LABELS[tx.type]}</td>
                  <td className="px-3 py-2 hidden sm:table-cell text-slate-600">{tx.reference ?? "—"}</td>
                  <td className="px-3 py-2 hidden md:table-cell text-slate-600 max-w-[160px] truncate">
                    {tx.description ?? "—"}
                  </td>
                  <td className="px-3 py-2 capitalize">{tx.method}</td>
                  <td className={`px-3 py-2 text-right font-medium ${accent === "in" ? "text-emerald-600" : "text-red-600"}`}>
                    {formatPrice(tx.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className={`px-4 py-3 border-t text-sm font-semibold flex justify-between ${headerClass}`}>
        <span>Total</span>
        <span>{formatPrice(String(total))}</span>
      </div>
    </div>
  );
}
