import { Suspense } from "react";
import { isDbConfigured } from "@/lib/db";
import { MarkNotificationsRead } from "@/components/boms/MarkNotificationsRead";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import { AdminDateRangeFilter } from "@/components/admin/AdminDateRangeFilter";
import Link from "next/link";
import { notificationHref } from "@/lib/notification-link";
import { getNotifications } from "@/lib/data";
import { dateSearchQuery, resolveSearchDateBounds } from "@/lib/admin/date-range";
import { NotificationDeleteButton } from "@/components/admin/NotificationDeleteButton";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{
    page?: string;
    filter?: string;
    from?: string;
    to?: string;
    preset?: string;
  }>;
}

export default async function AdminNotificationsPage({ searchParams }: Props) {
  const { page: pageStr = "1", filter = "all", from, to, preset } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const unreadOnly = filter === "unread";
  const bounds = resolveSearchDateBounds({ from, to, preset });
  const dateQuery = dateSearchQuery({ from, to, preset });
  const dateRange =
    bounds.from && bounds.to ? { from: bounds.from, to: bounds.to } : undefined;

  let notifications: Awaited<ReturnType<typeof getNotifications>> = [];
  let total = 0;

  if (isDbConfigured()) {
    const { listStaffNotificationsDb, countStaffNotificationsDb } = await import("@/lib/db/notifications");
    [notifications, total] = await Promise.all([
      listStaffNotificationsDb(undefined, PAGE_SIZE, offset, unreadOnly, dateRange),
      countStaffNotificationsDb(undefined, unreadOnly, dateRange),
    ]);
  } else {
    notifications = await getNotifications(unreadOnly);
    if (dateRange) {
      const fromMs = new Date(`${dateRange.from}T00:00:00.000Z`).getTime();
      const toMs = new Date(`${dateRange.to}T23:59:59.999Z`).getTime();
      notifications = notifications.filter((n) => {
        const t = new Date(n.createdAt).getTime();
        return t >= fromMs && t <= toMs;
      });
    }
    total = notifications.length;
    notifications = notifications.slice(offset, offset + PAGE_SIZE);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function filterHref(key: "all" | "unread") {
    const qs = new URLSearchParams();
    if (key === "unread") qs.set("filter", "unread");
    for (const [k, v] of Object.entries(dateQuery)) {
      if (v) qs.set(k, v);
    }
    const s = qs.toString();
    return s ? `/admin/notifications?${s}` : "/admin/notifications";
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <MarkNotificationsRead />
      </div>
      <div className="mb-4">
        <Suspense fallback={null}>
          <AdminDateRangeFilter preserveKeys={["filter", "page"]} />
        </Suspense>
      </div>
      <div className="flex gap-2 mb-6">
        <Link
          href={filterHref("all")}
          className={`px-3 py-1.5 rounded-full text-sm ${!unreadOnly ? "bg-slate-900 text-white" : "border border-slate-200"}`}
        >
          All
        </Link>
        <Link
          href={filterHref("unread")}
          className={`px-3 py-1.5 rounded-full text-sm ${unreadOnly ? "bg-slate-900 text-white" : "border border-slate-200"}`}
        >
          Unread
        </Link>
      </div>
      <AdminTableShell>
        <ul className="divide-y divide-slate-100">
          {notifications.map((n) => {
            const href = notificationHref(n);
            return (
              <li key={n.id} className={`p-4 ${n.read ? "opacity-60" : "border-l-4 border-l-[#4C3BCF]"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{n.title}</p>
                    {n.body && <p className="text-sm text-slate-500 mt-1">{n.body}</p>}
                    <p className="text-xs text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString("en-GB")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {href && (
                      <Link href={href} className="text-xs text-[#4C3BCF] hover:underline whitespace-nowrap">
                        {n.threadId ? "View inbox" : n.orderId ? "View order" : "Open"}
                      </Link>
                    )}
                    <NotificationDeleteButton id={n.id} />
                  </div>
                </div>
              </li>
            );
          })}
          {!notifications.length && <p className="text-slate-400 text-center py-12">No notifications.</p>}
        </ul>
      </AdminTableShell>
      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={PAGE_SIZE}
        basePath="/admin/notifications"
        query={{
          ...(unreadOnly ? { filter: "unread" } : {}),
          ...dateQuery,
        }}
      />
    </div>
  );
}
