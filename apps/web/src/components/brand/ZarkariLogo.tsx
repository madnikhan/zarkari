import { cn } from "@/lib/utils";

type Props = {
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
  suffix?: string;
  className?: string;
};

const sizeClasses = {
  sm: "text-sm tracking-[0.4em]",
  md: "text-xl tracking-[0.42em]",
  lg: "text-2xl tracking-[0.48em]",
};

const variantClasses = {
  dark: "text-charcoal",
  light: "text-cream",
};

export function ZarkariLogo({ size = "md", variant = "dark", suffix, className }: Props) {
  return (
    <span
      aria-label="ZARKARI"
      className={cn(
        "font-logo uppercase inline-flex items-baseline leading-none",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      Z<span aria-hidden>Λ</span>RK<span aria-hidden>Λ</span>RI
      {suffix && (
        <span className="font-sans font-normal normal-case tracking-normal text-[0.55em] ml-3 opacity-70">
          {suffix}
        </span>
      )}
    </span>
  );
}
