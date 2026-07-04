import { cn } from "@/lib/utils";

const COLOR_MAP = {
  green: "bg-emerald-500 text-white hover:bg-emerald-600",
  red: "bg-red-500 text-white hover:bg-red-600",
  orange: "bg-orange-500 text-white hover:bg-orange-600",
  blue: "bg-blue-500 text-white hover:bg-blue-600",
  purple: "bg-[#4C3BCF] text-white hover:bg-[#3d2fb8]",
  slate: "bg-slate-100 text-slate-700 hover:bg-slate-200",
} as const;

interface Props {
  children: React.ReactNode;
  color?: keyof typeof COLOR_MAP;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}

export function BomsActionButton({
  children,
  color = "purple",
  disabled,
  onClick,
  type = "button",
  className,
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full py-3.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm",
        COLOR_MAP[color],
        className
      )}
    >
      {children}
    </button>
  );
}
