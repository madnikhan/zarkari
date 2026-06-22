"use client";

import { useRouter } from "next/navigation";

export function MarkNotificationsRead() {
  const router = useRouter();

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    router.refresh();
  }

  return (
    <button type="button" onClick={markAllRead} className="text-sm text-[#4C3BCF] hover:underline">
      Mark all read
    </button>
  );
}
