import { notFound } from "next/navigation";
import {
  getSocialMessages,
  getSocialThread,
  updateSocialThread,
} from "@/lib/social-inbox/service";
import { InboxThreadView } from "@/components/admin/inbox/InboxThreadView";

interface Props {
  params: Promise<{ threadId: string }>;
}

export default async function AdminInboxThreadPage({ params }: Props) {
  const { threadId } = await params;
  const thread = await getSocialThread(threadId);
  if (!thread) notFound();

  const messages = await getSocialMessages(threadId);
  await updateSocialThread(threadId, { markRead: true });

  return (
    <div className="p-4 lg:p-8">
      <InboxThreadView thread={{ ...thread, unreadCount: 0 }} messages={messages} />
    </div>
  );
}
