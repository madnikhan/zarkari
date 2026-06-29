import { listSocialThreads } from "@/lib/social-inbox/service";
import { resolveInboxFilter } from "@/lib/social-inbox/filters";
import { InboxPageClient } from "@/components/admin/inbox/InboxPageClient";

interface Props {
  searchParams: Promise<{ platform?: string; unread?: string }>;
}

export default async function AdminInboxPage({ searchParams }: Props) {
  const params = await searchParams;
  const filter = resolveInboxFilter(params);
  const threads = await listSocialThreads({
    platform: filter.platform,
    unreadOnly: filter.unreadOnly,
  });

  return (
    <div className="p-4 lg:p-8">
      <InboxPageClient threads={threads} activeFilter={filter.key} />
    </div>
  );
}
