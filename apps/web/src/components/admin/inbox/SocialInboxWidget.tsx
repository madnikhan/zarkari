import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getSocialInboxStats } from "@/lib/social-inbox/service";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/social-inbox/types";

const WIDGET_PLATFORMS: SocialPlatform[] = [
  "facebook",
  "instagram",
  "whatsapp",
  "tiktok",
  "other",
];

export async function SocialInboxWidget() {
  const stats = await getSocialInboxStats();

  return (
    <div className="boms-card p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-[#4C3BCF]" />
          <h2 className="text-lg font-semibold text-slate-900">Social Inquiries</h2>
        </div>
        <Link
          href={stats.totalUnread ? "/admin/inbox?unread=1" : "/admin/inbox"}
          className="text-sm text-[#4C3BCF] hover:underline font-medium"
        >
          Open inbox
        </Link>
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-semibold text-slate-900">{stats.totalUnread}</span>
        <span className="text-sm text-slate-500">unread</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {WIDGET_PLATFORMS.map((p) => (
          <Link
            key={p}
            href={`/admin/inbox?platform=${p}`}
            className="rounded-lg bg-slate-50 px-3 py-2 hover:bg-[#4C3BCF]/5 transition-colors"
          >
            <p className="text-xs text-slate-500">{SOCIAL_PLATFORM_LABELS[p]}</p>
            <p className="text-lg font-semibold text-slate-900">{stats.byPlatform[p]}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
