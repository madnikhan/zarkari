import { getNotifications } from "@/lib/data";
import { MarkNotificationsRead } from "@/components/boms/MarkNotificationsRead";
import Link from "next/link";

export default async function AdminNotificationsPage() {
  const notifications = await getNotifications();

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
        <MarkNotificationsRead />
      </div>
      <ul className="space-y-3">
        {notifications.map((n) => (
          <li key={n.id} className={`boms-card p-4 ${n.read ? "opacity-60" : "border-l-4 border-l-[#4C3BCF]"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-slate-900">{n.title}</p>
                {n.body && <p className="text-sm text-slate-500 mt-1">{n.body}</p>}
                <p className="text-xs text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString("en-GB")}</p>
              </div>
              {n.orderId && (
                <Link href={`/admin/orders/${n.orderId}`} className="text-xs text-[#4C3BCF] hover:underline whitespace-nowrap">
                  View order
                </Link>
              )}
            </div>
          </li>
        ))}
        {!notifications.length && <p className="text-slate-400 text-center py-12">No notifications.</p>}
      </ul>
    </div>
  );
}
