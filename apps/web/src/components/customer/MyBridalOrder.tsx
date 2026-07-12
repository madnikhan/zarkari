"use client";

import { useState } from "react";
import type { BridalOrder, CustomerMessage, OrderFile } from "@/lib/data/seed";
import { OrderFileGallery } from "@/components/orders/OrderFileGallery";
import { MessageAttachment } from "@/components/orders/MessageAttachment";
import { CountdownBadge } from "@/components/orders/CountdownBadge";
import { CustomerOrderProgressTracker } from "./OrderProgressTracker";
import { getCustomerStatusLabel } from "@/lib/orders/status-machine";
import { formatPrice } from "@/lib/utils";

interface MyBridalOrderProps {
  order: BridalOrder;
  files: OrderFile[];
  messages: CustomerMessage[];
  cancellationReason?: string;
  refundReason?: string;
  onSendMessage: (message: string) => Promise<boolean>;
  messageError?: string;
  sending?: boolean;
}

export function MyBridalOrder({
  order,
  files,
  messages,
  cancellationReason,
  refundReason,
  onSendMessage,
  messageError,
  sending,
}: MyBridalOrderProps) {
  if (order.status === "cancelled" || order.status === "refunded") {
    const isCancelled = order.status === "cancelled";
    const reason = isCancelled ? cancellationReason : refundReason;
    return (
      <div className="max-w-lg mx-auto py-8 px-2 text-center">
        <p className="font-mono text-sm text-slate-500 mb-6">{order.orderNumber}</p>
        <div className="rounded-2xl border-2 border-red-500 bg-red-50 px-6 py-12">
          <p className="text-3xl sm:text-4xl font-bold uppercase tracking-wide text-red-600 leading-tight">
            {isCancelled ? "Cancelled" : "Refunded"}
          </p>
          <p className="mt-4 text-base sm:text-lg font-medium text-red-800">
            {isCancelled
              ? "Your order has been cancelled"
              : "Your order has been refunded"}
          </p>
          {reason?.trim() ? (
            <p className="mt-6 text-sm text-red-900/80 max-w-sm mx-auto">
              <span className="font-semibold">Reason: </span>
              {reason.trim()}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  const designFiles = files.filter((f) => f.category === "design");
  const measurementFiles = files.filter((f) => f.category === "measurements");
  const progressFiles = files.filter(
    (f) => f.category === "supplier_progress" || f.category === "completion"
  );
  const staffMessages = messages.filter((m) => m.senderType === "staff");

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

      <section className="mb-8 boms-card p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Updates from ZARKARI</h2>
        {staffMessages.length === 0 ? (
          <p className="text-sm text-slate-500">
            No updates yet — we&apos;ll post messages here as your order progresses.
          </p>
        ) : (
          <ul className="space-y-3">
            {staffMessages.map((m) => (
              <li key={m.id} className="rounded-lg bg-[#F4F3FF] border border-[#4C3BCF]/10 px-3 py-2.5">
                <p className="text-xs font-medium text-[#4C3BCF] mb-1">
                  {m.senderName ? `ZARKARI · ${m.senderName}` : "ZARKARI"}
                </p>
                <p className="text-sm text-slate-800">{m.message}</p>
                <MessageAttachment message={m} />
                <p className="text-[10px] text-slate-400 mt-1">
                  {new Date(m.createdAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CustomerActionButtons
        order={order}
        designFiles={designFiles}
        measurementFiles={measurementFiles}
        progressFiles={progressFiles}
        messages={messages}
        onSendMessage={onSendMessage}
        messageError={messageError}
        sending={sending}
      />
    </div>
  );
}

function CustomerActionButtons({
  order,
  designFiles,
  measurementFiles,
  progressFiles,
  messages,
  onSendMessage,
  messageError,
  sending,
}: {
  order: BridalOrder;
  designFiles: OrderFile[];
  measurementFiles: OrderFile[];
  progressFiles: OrderFile[];
  messages: CustomerMessage[];
  onSendMessage: (message: string) => Promise<boolean>;
  messageError?: string;
  sending?: boolean;
}) {
  const [view, setView] = useState<"design" | "measurements" | "progress" | "notes" | "message" | null>(null);
  const [message, setMessage] = useState("");

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {(
          [
            ["design", "View Uploaded Design"],
            ["measurements", "View Measurements"],
            ["progress", "Order Progress"],
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
        className="block w-full py-3.5 text-center text-xs tracking-wide uppercase boms-btn-primary rounded-lg mb-6"
      >
        Download Receipt
      </a>

      <section className="boms-card p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">Terms &amp; Conditions</h2>
        <p className="text-sm text-slate-600 mb-3">
          By placing this order you agree to our terms regarding deposits, delivery timelines, colour and design
          changes, alterations, and collection. Custom orders may not be eligible for refund once production has started.
        </p>
        <ul className="text-xs text-slate-500 space-y-1 mb-3 list-disc pl-4">
          <li>Deposits are non-refundable once the order is sent to the supplier.</li>
          <li>Colour and design changes are not guaranteed after production begins.</li>
          <li>Remaining balance is due on collection unless agreed otherwise.</li>
        </ul>
        <a href="/pages/terms" target="_blank" rel="noreferrer" className="text-sm text-[#4C3BCF] hover:underline">
          Read full terms &amp; conditions
        </a>
      </section>

      {view && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl">
            <h3 className="font-display text-lg mb-4 capitalize">{view.replace("_", " ")}</h3>
            {view === "design" && (
              <OrderFileGallery files={designFiles} groupByCategory={false} columns={2} emptyMessage="No design files yet." />
            )}
            {view === "measurements" && (
              <OrderFileGallery
                files={measurementFiles}
                groupByCategory={false}
                columns={2}
                emptyMessage="No measurement files yet."
              />
            )}
            {view === "progress" && (
              <OrderFileGallery
                files={progressFiles}
                groupByCategory={false}
                columns={2}
                emptyMessage="No progress photos yet — we will share updates here."
              />
            )}
            {view === "notes" && (
              <p className="text-sm text-charcoal/70">{order.customisationNotes ?? "No customisation notes on file."}</p>
            )}
            {view === "message" && (
              <>
                <ul className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {messages.length === 0 && (
                    <p className="text-sm text-charcoal/50">No messages yet. Send us a note below.</p>
                  )}
                  {messages.map((m) => (
                    <li
                      key={m.id}
                      className={`text-sm p-2 rounded ${m.senderType === "customer" ? "bg-sand/30" : "bg-charcoal/5"}`}
                    >
                      <p className="text-[10px] uppercase tracking-wide text-charcoal/50 mb-0.5">
                        {m.senderType === "customer" ? "You" : m.senderName ? `ZARKARI · ${m.senderName}` : "ZARKARI"}
                      </p>
                      {m.message}
                      <MessageAttachment message={m} />
                    </li>
                  ))}
                </ul>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!message.trim() || sending) return;
                    const text = message;
                    const ok = await onSendMessage(text);
                    if (ok) setMessage("");
                  }}
                  className="space-y-2"
                >
                  {messageError && <p className="text-xs text-red-600">{messageError}</p>}
                  <div className="flex gap-2">
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 border border-sand rounded px-3 py-2 text-sm"
                      placeholder="Your message..."
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !message.trim()}
                      className="px-3 py-2 boms-btn-primary text-xs rounded-lg disabled:opacity-50"
                    >
                      {sending ? "Sending…" : "Send"}
                    </button>
                  </div>
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
