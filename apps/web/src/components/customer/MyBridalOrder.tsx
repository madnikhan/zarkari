"use client";

import { useState } from "react";
import Image from "next/image";
import type { BridalOrder, CustomerMessage, OrderFile } from "@/lib/data/seed";
import { CountdownBadge } from "@/components/orders/CountdownBadge";
import { CustomerOrderProgressTracker } from "./OrderProgressTracker";
import { getCustomerStatusLabel } from "@/lib/orders/status-machine";
import { formatPrice } from "@/lib/utils";

interface MyBridalOrderProps {
  order: BridalOrder;
  files: OrderFile[];
  messages: CustomerMessage[];
  onSendMessage: (message: string) => Promise<void>;
}

export function MyBridalOrder({ order, files, messages, onSendMessage }: MyBridalOrderProps) {
  const designFiles = files.filter((f) => f.category === "design");
  const measurementFiles = files.filter((f) => f.category === "measurements");

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-6 text-center">My Bridal Order</h1>

      <div className="boms-card p-5 mb-6 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Order No</span>
          <span className="font-mono font-medium text-[#4C3BCF]">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Status</span>
          <span>{getCustomerStatusLabel(order.status)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Delivery Date</span>
          <span>{new Date(order.deliveryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Time Left</span>
          <CountdownBadge deliveryDate={order.deliveryDate} />
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Deposit Paid</span>
          <span>{formatPrice(order.depositPaid)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Remaining Balance</span>
          <span>{formatPrice(order.remainingBalance)}</span>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wide text-slate-500 mb-4">Progress</h2>
        <CustomerOrderProgressTracker status={order.status} />
      </section>

      <CustomerActionButtons
        order={order}
        designFiles={designFiles}
        measurementFiles={measurementFiles}
        messages={messages}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}

function CustomerActionButtons({
  order,
  designFiles,
  measurementFiles,
  messages,
  onSendMessage,
}: {
  order: BridalOrder;
  designFiles: OrderFile[];
  measurementFiles: OrderFile[];
  messages: CustomerMessage[];
  onSendMessage: (message: string) => Promise<void>;
}) {
  const [view, setView] = useState<"design" | "measurements" | "notes" | "message" | null>(null);
  const [message, setMessage] = useState("");

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {(
          [
            ["design", "View Uploaded Design"],
            ["measurements", "View Measurements"],
            ["notes", "View Customisation Notes"],
            ["message", "Message Shop"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className="py-3 px-2 text-xs tracking-wide uppercase border border-slate-200 rounded-lg hover:border-[#4C3BCF] hover:bg-[#F4F3FF] transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <a
        href={`/api/customer/receipt?orderId=${order.id}`}
        target="_blank"
        rel="noreferrer"
        className="block w-full py-3.5 text-center text-xs tracking-wide uppercase boms-btn-primary rounded-lg"
      >
        Download Receipt
      </a>

      {view && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl">
            <h3 className="font-display text-lg mb-4 capitalize">{view.replace("_", " ")}</h3>
            {view === "design" && (
              <div className="grid grid-cols-2 gap-2">
                {designFiles.length ? (
                  designFiles.map((f) => (
                    <div key={f.id} className="relative aspect-square">
                      <Image src={f.url} alt={f.fileName} fill sizes="150px" className="object-cover rounded" />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-charcoal/50">No design files yet.</p>
                )}
              </div>
            )}
            {view === "measurements" && (
              <ul className="text-sm space-y-2">
                {measurementFiles.length ? (
                  measurementFiles.map((f) => (
                    <li key={f.id}>
                      <a href={f.url} className="text-gold hover:underline">
                        {f.fileName}
                      </a>
                    </li>
                  ))
                ) : (
                  <p className="text-charcoal/50">No measurement files yet.</p>
                )}
              </ul>
            )}
            {view === "notes" && (
              <p className="text-sm text-charcoal/70">{order.customisationNotes ?? "No customisation notes on file."}</p>
            )}
            {view === "message" && (
              <>
                <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {messages.map((m) => (
                    <li
                      key={m.id}
                      className={`text-sm p-2 rounded ${m.senderType === "customer" ? "bg-sand/30" : "bg-charcoal/5"}`}
                    >
                      {m.message}
                    </li>
                  ))}
                </ul>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await onSendMessage(message);
                    setMessage("");
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 border border-sand rounded px-3 py-2 text-sm"
                    placeholder="Your message..."
                  />
                  <button type="submit" className="px-3 py-2 boms-btn-primary text-xs rounded-lg">
                    Send
                  </button>
                </form>
              </>
            )}
            <button type="button" onClick={() => setView(null)} className="mt-4 text-sm text-charcoal/60">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
