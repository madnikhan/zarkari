import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function AdminTableShell({ children, className }: Props) {
  return (
    <div className={cn("boms-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <div className="max-h-[min(70vh,720px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
