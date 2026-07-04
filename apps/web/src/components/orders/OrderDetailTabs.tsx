"use client";

import { useState } from "react";
import { OrderTimeline } from "./OrderTimeline";
import type { TimelineEvent, OrderFile, BridalOrder } from "@/lib/data/seed";
import { formatPrice } from "@/lib/utils";

interface TabData {
  order: BridalOrder;
  timeline: TimelineEvent[];
  files: OrderFile[];
  redesigns: { id: string; reason: string; createdAt: string; createdByName?: string }[];
  cancellations: { id: string; reason: string; createdAt: string }[];
  refunds: { id: string; reason: string; amount: string; createdAt: string }[];
  payments: { id: string; type: string; amount: string; method?: string; createdAt: string }[];
}

const TABS = ["Timeline", "Files", "Payments", "Notes"] as const;

export function OrderDetailTabs({ data }: { data: TabData }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Timeline");

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto sticky top-0 bg-white z-10 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 min-w-[4.5rem] px-3 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors text-center ${
              tab === t ? "border-[#4C3BCF] text-[#4C3BCF] font-semibold" : "border-transparent text-slate-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Timeline" && <OrderTimeline events={data.timeline} />}

      {tab === "Files" && (
        <ul className="space-y-2 text-sm">
          {data.files.map((f) => (
            <li key={f.id}>
              <a href={f.url} target="_blank" rel="noreferrer" className="text-gold hover:underline">
                {f.fileName} ({f.category})
              </a>
            </li>
          ))}
        </ul>
      )}

      {tab === "Payments" && (
        <ul className="space-y-3 text-sm">
          {data.payments.map((p) => (
            <li key={p.id} className="flex justify-between border-b border-sand pb-2">
              <span className="capitalize">{p.type}</span>
              <span>{formatPrice(p.amount)} · {p.method}</span>
            </li>
          ))}
        </ul>
      )}

      {tab === "Notes" && (
        <div className="space-y-6 text-sm">
          {data.order.customisationNotes && (
            <section>
              <h3 className="font-medium mb-2 text-slate-900">Customisation Notes</h3>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{data.order.customisationNotes}</p>
            </section>
          )}
          {data.redesigns.length > 0 && (
            <section>
              <h3 className="font-medium mb-2 text-slate-900">Redesigns</h3>
              {data.redesigns.map((r) => (
                <div key={r.id} className="bg-amber-50 p-3 rounded-lg mb-2">
                  <p>{r.reason}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(r.createdAt).toLocaleString("en-GB")}</p>
                </div>
              ))}
            </section>
          )}
          {data.cancellations.length > 0 && (
            <section>
              <h3 className="font-medium mb-2 text-slate-900">Cancellations</h3>
              {data.cancellations.map((c) => (
                <div key={c.id} className="bg-red-50 p-3 rounded-lg mb-2">{c.reason}</div>
              ))}
            </section>
          )}
          {data.refunds.length > 0 && (
            <section>
              <h3 className="font-medium mb-2 text-slate-900">Refunds</h3>
              {data.refunds.map((r) => (
                <div key={r.id} className="bg-slate-50 p-3 rounded-lg mb-2">{r.reason} — {formatPrice(r.amount)}</div>
              ))}
            </section>
          )}
          {!data.order.customisationNotes && data.redesigns.length === 0 && data.cancellations.length === 0 && data.refunds.length === 0 && (
            <p className="text-slate-400">No notes yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
