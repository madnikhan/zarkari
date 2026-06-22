import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  href?: string;
  icon?: LucideIcon;
  accent?: "default" | "warning" | "danger" | "success";
}

const accents = {
  default: "text-[#4C3BCF]",
  warning: "text-amber-600",
  danger: "text-red-600",
  success: "text-emerald-600",
};

export function StatCard({ label, value, subtitle, href, icon: Icon, accent = "default" }: StatCardProps) {
  return (
    <div className="boms-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
          <p className={cn("text-3xl font-semibold mt-1", accents[accent])}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-[#F4F3FF]">
            <Icon className="h-5 w-5 text-[#4C3BCF]" />
          </div>
        )}
      </div>
      {href && (
        <Link href={href} className="text-xs text-[#4C3BCF] hover:underline mt-3 inline-block">
          View all →
        </Link>
      )}
    </div>
  );
}
