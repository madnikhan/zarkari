"use client";

import Link from "next/link";
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import type { SocialPlatform, SocialThread } from "@/lib/social-inbox/types";
import { InboxThreadList } from "@/components/admin/inbox/InboxThreadList";
import { ManualInquiryForm } from "@/components/admin/inbox/ManualInquiryForm";
import { cn } from "@/lib/utils";

const FILTERS: Array<{ key: string; label: string; platform?: SocialPlatform; unread?: boolean }> = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread", unread: true },
  { key: "facebook", label: "Facebook", platform: "facebook" },
  { key: "instagram", label: "Instagram", platform: "instagram" },
  { key: "whatsapp", label: "WhatsApp", platform: "whatsapp" },
  { key: "tiktok", label: "TikTok", platform: "tiktok" },
  { key: "other", label: "Other", platform: "other" },
];

interface InboxPageClientProps {
  threads: SocialThread[];
  activeFilter: string;
}

export function InboxPageClient({ threads, activeFilter }: InboxPageClientProps) {
  const [showManual, setShowManual] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Social Inbox</h1>
          <p className="text-sm text-slate-500 mt-1">
            Facebook, Instagram, WhatsApp &amp; manual inquiries in one place
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowManual(true)}
          className="boms-btn-primary px-4 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Log inquiry
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const href =
            f.key === "all"
              ? "/admin/inbox"
              : f.unread
                ? "/admin/inbox?unread=1"
                : `/admin/inbox?platform=${f.platform}`;
          const active = activeFilter === f.key;
          return (
            <Link
              key={f.key}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors",
                active
                  ? "bg-[#4C3BCF] text-white border-[#4C3BCF]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#4C3BCF]/30"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <InboxThreadList threads={threads} />
      <ManualInquiryForm open={showManual} onClose={() => setShowManual(false)} />
    </>
  );
}
