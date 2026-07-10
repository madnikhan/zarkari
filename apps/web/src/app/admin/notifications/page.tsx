import { isDbConfigured } from "@/lib/db";
import { MarkNotificationsRead } from "@/components/boms/MarkNotificationsRead";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminTableShell } from "@/components/admin/AdminTableShell";
import Link from "next/link";
import { notificationHref } from "@/lib/notification-link";
import { getNotifications } from "@/lib/data";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string; filter?: string }>;
}

export default async function AdminNotificationsPage({ searchParams }: Props) {
  const { page: pageStr = "1", filter = "all" } = await searchParams;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const unreadOnly = filter === "unread";

  let notifications: Awaited<ReturnType<typeof getNotifications>> = [];
  let total = 0;

  if (isDbConfigured()) {
    const { listStaffNotificationsDb, countStaffNotificationsDb } = await import("@/lib/db/notifications");
    [notifications, total] = await Promise.all([
      listStaffNotificationsDb(undefined, PAGE_SIZE, offset, unreadOnly),
      countStaffNotificationsDb(undefined, unreadOnly),
    ]);
  } else {
    notifications = await getNotifications(unreadOnly);
    total = notifications.length;
    notifications = notifications.slice(offset, offset + PAGE_SIZE);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (filter === "unread") params.set("filter", "unread");
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/admin/notifications?${qs}` : "/admin/notifications";
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <MarkNotificationsRead />
      </div>
      <div className="flex gap-2 mb-6">
        <Link
          href="/admin/notifications?filter=all"
          className={`px-3 py-1.5 rounded-full text-sm ${!unreadOnly ? "bg-slate-900 text-white" : "border border-slate-200"}`}
        >
          All
        </Link>
        <Link
          href="/admin/notifications?filter=unread"
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
                  {href && (
                    <Link href={href} className="text-xs text-[#4C3BCF] hover:underline whitespace-nowrap">
                      {n.threadId ? "View inbox" : n.orderId ? "View order" : "Open"}
                    </Link>
                  )}
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
        buildHref={buildHref}
      />
    </div>
  );
}
