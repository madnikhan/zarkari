import { listSocialThreads } from "@/lib/social-inbox/service";
import { resolveInboxFilter } from "@/lib/social-inbox/filters";
import { InboxPageClient } from "@/components/admin/inbox/InboxPageClient";
import { dateSearchQuery, resolveSearchDateBounds } from "@/lib/admin/date-range";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{
    platform?: string;
    unread?: string;
    page?: string;
    q?: string;
    from?: string;
    to?: string;
    preset?: string;
  }>;
}

export default async function AdminInboxPage({ searchParams }: Props) {
  const params = await searchParams;
  const filter = resolveInboxFilter(params);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const q = params.q?.trim() ?? "";
  const bounds = resolveSearchDateBounds({
    from: params.from,
    to: params.to,
    preset: params.preset,
  });
  const dateQuery = dateSearchQuery({
    from: params.from,
    to: params.to,
    preset: params.preset,
  });

  const { threads, total } = await listSocialThreads({
    platform: filter.platform,
    unreadOnly: filter.unreadOnly,
    q: q || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    from: bounds.from,
    to: bounds.to,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-4 lg:p-8">
      <InboxPageClient
        threads={threads}
        activeFilter={filter.key}
        page={page}
        totalPages={totalPages}
        total={total}
        q={q}
        dateQuery={dateQuery}
      />
    </div>
  );
}
