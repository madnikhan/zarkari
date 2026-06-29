import type { SocialPlatform } from "@/lib/social-inbox/types";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/social-inbox/types";
import { cn } from "@/lib/utils";

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  facebook: "bg-blue-100 text-blue-700",
  instagram: "bg-pink-100 text-pink-700",
  whatsapp: "bg-green-100 text-green-700",
  tiktok: "bg-slate-900 text-white",
  pinterest: "bg-red-100 text-red-700",
  email: "bg-slate-100 text-slate-700",
  walkin: "bg-amber-100 text-amber-800",
  other: "bg-slate-100 text-slate-600",
};

export function PlatformBadge({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        PLATFORM_COLORS[platform],
        className
      )}
    >
      {SOCIAL_PLATFORM_LABELS[platform]}
    </span>
  );
}

export function ThreadStatusBadge({ status }: { status: string }) {
  const styles =
    status === "open"
      ? "bg-amber-50 text-amber-700"
      : status === "replied"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-500";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", styles)}>
      {status}
    </span>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatThreadTime(iso: string): string {
  return formatRelative(iso);
}
