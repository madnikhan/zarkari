"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { notificationHref } from "@/lib/notification-link";
import { getClientFirestore } from "@/lib/firebase/client";
import { isFirebaseClientConfigured } from "@/lib/firebase/config";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { stopNotificationAlert, useNotificationAlert } from "@/hooks/useNotificationAlert";

interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: string;
  href?: string;
  threadId?: string;
  orderId?: string;
}

export function NotificationBell() {
  const { ready } = useFirebaseAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [fetchError, setFetchError] = useState("");
  const [liveUnread, setLiveUnread] = useState(0);

  async function load() {
    setFetchError("");
    try {
      const r = await fetch("/api/notifications");
      if (!r.ok) throw new Error("Failed to load");
      const d = await r.json();
      setNotifications(d.notifications ?? []);
    } catch {
      setFetchError("Could not load notifications");
    }
  }

  useEffect(() => {
    if (open) load();
  }, [open]);

  useEffect(() => {
    if (!ready || !isFirebaseClientConfigured()) {
      const poll = async () => {
        try {
          const r = await fetch("/api/notifications?countOnly=true");
          if (!r.ok) return;
          const d = await r.json();
          setLiveUnread(d.unread ?? 0);
        } catch {
          /* ignore polling errors */
        }
      };
      void poll();
      const interval = window.setInterval(poll, 15000);
      return () => window.clearInterval(interval);
    }

    const db = getClientFirestore();
    if (!db) return;

    const unsubShared = onSnapshot(doc(db, "staff_inbox", "shared"), (snapshot) => {
      setLiveUnread(snapshot.data()?.unreadCount ?? 0);
    });

    return () => unsubShared();
  }, [ready]);

  const listUnread = notifications.filter((n) => !n.read).length;
  const unread = open ? listUnread : liveUnread || listUnread;
  useNotificationAlert(unread, !open);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setLiveUnread((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setLiveUnread(0);
    stopNotificationAlert();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) stopNotificationAlert();
        }}
        className="relative p-2 text-charcoal/70 hover:text-charcoal"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[8px] h-2 px-0.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-sand rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-sand flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-charcoal/50">Notifications</p>
            {listUnread > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs text-[#4C3BCF] hover:underline">
                Mark all read
              </button>
            )}
          </div>
          {fetchError ? (
            <p className="p-4 text-sm text-red-600">{fetchError}</p>
          ) : notifications.length ? (
            notifications.map((n) => {
              const href = notificationHref(n);
              const content = (
                <>
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="text-charcoal/60 text-xs mt-0.5">{n.body}</p>}
                </>
              );
              const className = `block p-3 border-b border-sand/50 text-sm hover:bg-sand/30 ${n.read ? "opacity-60" : ""}`;
              if (href) {
                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => {
                      if (!n.read) markRead(n.id);
                      setOpen(false);
                      stopNotificationAlert();
                    }}
                    className={className}
                  >
                    {content}
                  </Link>
                );
              }
              return (
                <div
                  key={n.id}
                  className={className}
                  onClick={() => {
                    if (!n.read) markRead(n.id);
                    stopNotificationAlert();
                  }}
                  onKeyDown={() => {}}
                  role="button"
                  tabIndex={0}
                >
                  {content}
                </div>
              );
            })
          ) : (
            <p className="p-4 text-sm text-charcoal/50">No notifications</p>
          )}
        </div>
      )}
    </div>
  );
}
