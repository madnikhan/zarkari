"use client";

import { useState } from "react";
import {
  Banknote,
  CircleDollarSign,
  Receipt,
  ShoppingBag,
  Truck,
  Undo2,
  Users,
  Wallet,
} from "lucide-react";
import type { CashDirection, CashTransactionType } from "@/lib/db/cash-ledger";
import { AddTransactionModal } from "./AddTransactionModal";

interface QuickAction {
  label: string;
  type: CashTransactionType;
  icon: React.ComponentType<{ className?: string }>;
}

const CASH_IN_ACTIONS: QuickAction[] = [
  { label: "Order Deposit", type: "order_deposit", icon: CircleDollarSign },
  { label: "Order Collection", type: "order_collection", icon: Receipt },
  { label: "Ready Made Sale", type: "ready_made_sale", icon: ShoppingBag },
  { label: "Others", type: "other_in", icon: Wallet },
];

const CASH_OUT_ACTIONS: QuickAction[] = [
  { label: "Supplier Payment", type: "supplier_payment", icon: Truck },
  { label: "Business Expenses", type: "business_expense", icon: Banknote },
  { label: "Refund", type: "refund", icon: Undo2 },
  { label: "Others", type: "other_out", icon: Users },
];

interface Props {
  date: string;
}

export function CashQuickActions({ date }: Props) {
  const [modal, setModal] = useState<{ direction: CashDirection; type: CashTransactionType } | null>(null);

  function ActionGroup({
    title,
    accent,
    actions,
    direction,
  }: {
    title: string;
    accent: string;
    actions: QuickAction[];
    direction: CashDirection;
  }) {
    return (
      <div className="boms-card p-4">
        <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${accent}`}>{title}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {actions.map((action) => (
            <button
              key={action.type}
              type="button"
              onClick={() => setModal({ direction, type: action.type })}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-100 hover:border-[#4C3BCF]/30 hover:bg-[#F4F3FF]/50 transition-colors"
            >
              <action.icon className="h-5 w-5 text-[#4C3BCF]" />
              <span className="text-xs text-center text-slate-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-4 print:hidden">
        <ActionGroup title="Cash In" accent="text-emerald-600" actions={CASH_IN_ACTIONS} direction="in" />
        <ActionGroup title="Cash Out" accent="text-red-600" actions={CASH_OUT_ACTIONS} direction="out" />
      </div>
      {modal && (
        <AddTransactionModal
          open
          date={date}
          direction={modal.direction}
          defaultType={modal.type}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
