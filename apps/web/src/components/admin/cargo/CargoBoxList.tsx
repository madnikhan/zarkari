"use client";

import type { CargoBox } from "@/lib/cargo/demo-store";

interface Props {
  boxes: CargoBox[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CargoBoxList({ boxes, selectedId, onSelect }: Props) {
  if (!boxes.length) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-sm text-slate-400">
        No boxes yet
      </div>
    );
  }

  return (
    <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
      {boxes.map((box) => (
        <li key={box.id}>
          <button
            type="button"
            onClick={() => onSelect(box.id)}
            className={`w-full text-left px-3 py-3 hover:bg-slate-50 transition-colors ${
              selectedId === box.id ? "bg-[#F4F3FF] border-l-2 border-[#4C3BCF]" : ""
            }`}
          >
            <p className="font-mono text-sm font-medium text-[#4C3BCF]">{box.boxNumber}</p>
            <p className="text-xs text-slate-600 mt-0.5">{box.cargoCompanyName}</p>
            <p className="text-xs text-slate-500 truncate">{box.trackingNumber}</p>
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>{box.supplierName}</span>
              <span>{box.receivedDate}</span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
