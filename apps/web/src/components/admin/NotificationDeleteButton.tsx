"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function NotificationDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm("Delete this notification?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={loading}
      className="p-1.5 rounded hover:bg-red-50 disabled:opacity-50"
      aria-label="Delete notification"
    >
      <Trash2 className="h-3.5 w-3.5 text-red-400" />
    </button>
  );
}
