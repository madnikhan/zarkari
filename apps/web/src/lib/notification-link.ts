import type { AppNotification } from "@/lib/data/seed";

export function notificationHref(n: Pick<AppNotification, "href" | "orderId" | "threadId">): string | null {
  if (n.href) return n.href;
  if (n.threadId) return `/admin/inbox/${n.threadId}`;
  if (n.orderId) return `/admin/orders/${n.orderId}`;
  return null;
}
