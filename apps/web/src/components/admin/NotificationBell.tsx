"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

interface Props {
  role?: "admin" | "supplier";
  supplierId?: string;
}

export function NotificationBell({ role = "admin", supplierId }: Props) {
  const { ready } = useFirebaseAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fetchError, setFetchError] = useState("");
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const isSupplier = role === "supplier";

  async function load() {
    setFetchError("");
    try {
      const r = await fetch("/api/notifications?unreadOnly=true");
      if (!r.ok) throw new Error("Failed to load");
      const d = await r.json();
      const list = (d.notifications ?? []) as NotificationItem[];
      setNotifications(list);
      const countRes = await fetch("/api/notifications?countOnly=true");
      if (countRes.ok) {
        const countData = await countRes.json();
        setUnreadCount(countData.unread ?? list.length);
      } else {
        setUnreadCount(list.length);
      }
    } catch {
      setFetchError("Could not load notifications");
    }
  }

  async function pollCount() {
    try {
      const r = await fetch("/api/notifications?countOnly=true");
      if (!r.ok) return;
      const d = await r.json();
      setUnreadCount(d.unread ?? 0);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    setMounted(true);
    void load();
  }, []);

  useEffect(() => {
    if (open) {
      void load();
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 8,
          right: Math.max(16, window.innerWidth - rect.right),
        });
      }
    }
  }, [open]);

  useEffect(() => {
    void pollCount();
    const interval = window.setInterval(pollCount, 3000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!ready || !isFirebaseClientConfigured()) return;
    const db = getClientFirestore();
    if (!db) return;

    const inboxPath = isSupplier && supplierId
      ? doc(db, "supplier_inbox", supplierId)
      : doc(db, "staff_inbox", "shared");

    const unsub = onSnapshot(
      inboxPath,
      () => {
        void pollCount();
        void load();
      },
      (err) => console.error("inbox listener error", err)
    );

    return () => unsub();
  }, [ready, isSupplier, supplierId]);

  useNotificationAlert(unreadCount, !open);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications([]);
    setUnreadCount(0);
    stopNotificationAlert();
  }

  const dropdown = open ? (
    <div
      className="fixed z-[60] w-[min(20rem,calc(100vw-2rem))] bg-white border border-slate-200 rounded-lg shadow-xl max-h-96 overflow-y-auto text-slate-900"
      style={{ top: dropdownPos.top, right: dropdownPos.right }}
    >
      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-500">Notifications</p>
        {notifications.length > 0 && (
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
              <p className="font-medium text-slate-900">{n.title}</p>
              {n.body && <p className="text-slate-600 text-xs mt-0.5">{n.body}</p>}
            </>
          );
          const className =
            "block p-3 border-b border-slate-100 text-sm hover:bg-slate-50 text-slate-900";
          if (href) {
            return (
              <Link
                key={n.id}
                href={href}
                onClick={() => {
                  void markRead(n.id);
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
                void markRead(n.id);
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
        <p className="p-4 text-sm text-slate-500">No notifications</p>
      )}
      {!isSupplier && (
        <div className="p-3 border-t border-slate-100">
          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className="text-xs text-[#4C3BCF] hover:underline"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) stopNotificationAlert();
        }}
        className="relative p-2 text-slate-600 hover:text-slate-900"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[8px] h-2 px-0.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {mounted && dropdown ? createPortal(dropdown, document.body) : null}
      {open && mounted ? (
        <button
          type="button"
          className="fixed inset-0 z-[55] cursor-default"
          aria-label="Close notifications"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}
