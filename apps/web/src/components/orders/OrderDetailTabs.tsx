"use client";

import { useState } from "react";
import { OrderTimeline } from "./OrderTimeline";
import { ProductionStepper } from "./ProductionStepper";
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

const TABS = ["Details", "Timeline", "Files", "Payments", "History"] as const;

export function OrderDetailTabs({ data }: { data: TabData }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Details");

  return (
    <div>
      <div className="flex gap-1 border-b border-sand mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t ? "border-gold text-charcoal font-medium" : "border-transparent text-charcoal/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Details" && (
        <div className="space-y-6">
          <ProductionStepper status={data.order.status} />
          <p className="text-sm text-charcoal/60">{data.order.customisationNotes}</p>
        </div>
      )}

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

      {tab === "History" && (
        <div className="space-y-6 text-sm">
          {data.redesigns.length > 0 && (
            <section>
              <h3 className="font-medium mb-2">Redesigns</h3>
              {data.redesigns.map((r) => (
                <div key={r.id} className="bg-sand/20 p-3 rounded mb-2">
                  <p>{r.reason}</p>
                  <p className="text-xs text-charcoal/50 mt-1">{new Date(r.createdAt).toLocaleString("en-GB")}</p>
                </div>
              ))}
            </section>
          )}
          {data.cancellations.length > 0 && (
            <section>
              <h3 className="font-medium mb-2">Cancellations</h3>
              {data.cancellations.map((c) => (
                <div key={c.id} className="bg-red-50 p-3 rounded mb-2">{c.reason}</div>
              ))}
            </section>
          )}
          {data.refunds.length > 0 && (
            <section>
              <h3 className="font-medium mb-2">Refunds</h3>
              {data.refunds.map((r) => (
                <div key={r.id} className="bg-sand/20 p-3 rounded mb-2">{r.reason} — {formatPrice(r.amount)}</div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
