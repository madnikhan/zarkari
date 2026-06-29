"use client";

import Link from "next/link";
import type { SocialThread } from "@/lib/social-inbox/types";
import { PlatformBadge, ThreadStatusBadge, formatThreadTime } from "./PlatformBadge";

interface InboxThreadListProps {
  threads: SocialThread[];
}

export function InboxThreadList({ threads }: InboxThreadListProps) {
  if (!threads.length) {
    return (
      <div className="boms-card p-8 text-center text-slate-500 text-sm">
        No inquiries match this filter.
      </div>
    );
  }

  return (
    <div className="boms-card overflow-hidden divide-y divide-slate-100">
      {threads.map((thread) => {
        const name =
          thread.contactName ??
          thread.contactHandle ??
          thread.contactPhone ??
          "Unknown contact";
        return (
          <Link
            key={thread.id}
            href={`/admin/inbox/${thread.id}`}
            className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/80 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-[#4C3BCF]/10 text-[#4C3BCF] flex items-center justify-center text-sm font-medium flex-shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-slate-900 truncate">{name}</p>
                <PlatformBadge platform={thread.platform} />
                {thread.unreadCount > 0 && (
                  <span className="bg-[#4C3BCF] text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                    {thread.unreadCount}
                  </span>
                )}
              </div>
              {thread.subject && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{thread.subject}</p>
              )}
              <p className="text-sm text-slate-600 truncate mt-0.5">
                {thread.lastMessagePreview ?? "—"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-xs text-slate-400">{formatThreadTime(thread.lastMessageAt)}</span>
              <ThreadStatusBadge status={thread.status} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
