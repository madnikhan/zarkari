"use client";

import { useEffect, useState } from "react";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; title: string; body?: string; read: boolean; createdAt: string }[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []));
  }, [open]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 text-charcoal/70 hover:text-charcoal"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-sand rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <p className="p-3 text-xs uppercase tracking-wide text-charcoal/50 border-b border-sand">Notifications</p>
          {notifications.length ? notifications.map((n) => (
            <div key={n.id} className={`p-3 border-b border-sand/50 text-sm ${n.read ? "opacity-60" : ""}`}>
              <p className="font-medium">{n.title}</p>
              {n.body && <p className="text-charcoal/60 text-xs mt-0.5">{n.body}</p>}
            </div>
          )) : (
            <p className="p-4 text-sm text-charcoal/50">No notifications</p>
          )}
        </div>
      )}
    </div>
  );
}
