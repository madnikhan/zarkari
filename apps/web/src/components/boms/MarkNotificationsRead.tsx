"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkNotificationsRead() {
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    router.refresh();
  }

  async function clearRead() {
    if (!confirm("Clear all read notifications?")) return;
    setClearing(true);
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearRead: true }),
      });
      router.refresh();
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={markAllRead} className="text-sm text-[#4C3BCF] hover:underline">
        Mark all read
      </button>
      <button
        type="button"
        onClick={clearRead}
        disabled={clearing}
        className="text-sm text-slate-500 hover:text-red-600 hover:underline disabled:opacity-50"
      >
        {clearing ? "Clearing…" : "Clear read"}
      </button>
    </div>
  );
}
