"use client";

import { useState } from "react";
import { MEASUREMENT_FIELDS, formatInches } from "@/lib/sizing";
import type { RetailOrder } from "@/lib/data/seed";
import { RetailOrderStatusSelect } from "@/components/admin/RetailOrderStatusSelect";

export function RetailOrderRow({ order }: { order: RetailOrder }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className="hover:bg-slate-50/50">
        <td className="px-4 py-3 font-mono text-xs text-[#4C3BCF]">{order.orderNumber}</td>
        <td className="px-4 py-3">
          <p className="font-medium">{order.customerName ?? order.customerEmail}</p>
          <p className="text-xs text-slate-400">{order.customerEmail}</p>
        </td>
        <td className="px-4 py-3 font-medium">{order.total}</td>
        <td className="px-4 py-3">
          <RetailOrderStatusSelect orderId={order.id} currentStatus={order.status} />
        </td>
        <td className="px-4 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString("en-GB")}</td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-xs text-[#4C3BCF] hover:underline uppercase tracking-wider"
          >
            {open ? "Hide" : "Details"}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50/80">
          <td colSpan={6} className="px-4 py-4">
            <ul className="space-y-4">
              {order.items.map((item, idx) => (
                <li key={idx} className="text-sm border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                  <p className="font-medium text-slate-900">
                    {item.title} × {item.quantity} — £{item.price}
                  </p>
                  {item.sizeSelection && (
                    <div className="mt-2 text-slate-600">
                      <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                        {item.sizeSelection.mode === "standard"
                          ? `Standard size ${item.sizeSelection.label}`
                          : "Custom measurements"}
                      </p>
                      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-1 text-xs">
                        {MEASUREMENT_FIELDS.map((field) => (
                          <div key={field.key}>
                            <dt className="text-slate-400">{field.label}</dt>
                            <dd className="font-medium">
                              {formatInches(item.sizeSelection!.measurements[field.key])}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}
