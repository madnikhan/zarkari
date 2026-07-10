"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, PlusCircle, Bell, Inbox, FileText, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Stock", href: "/admin/stock", icon: Package },
  { label: "Content", href: "/admin/content", icon: FileText },
  { label: "New", href: "/admin/orders/new", icon: PlusCircle },
  { label: "Inbox", href: "/admin/inbox", icon: Inbox },
  { label: "Alerts", href: "/admin/notifications", icon: Bell },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 lg:hidden">
      <div className="flex items-center justify-around py-2 overflow-x-auto">
        {items.map((item) => {
          const active =
            item.href === "/admin/orders"
              ? pathname === "/admin/orders" || pathname.startsWith("/admin/orders/shop")
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] min-w-[3rem]",
                active ? "text-[#4C3BCF]" : "text-slate-400"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SupplierMobileNav() {
  const pathname = usePathname();
  const supplierItems = [{ label: "History", href: "/supplier", icon: ShoppingBag }];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 lg:hidden">
      <div className="flex items-center justify-around py-2">
        {supplierItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-0.5 px-3 py-1 text-[10px]", active ? "text-[#4C3BCF]" : "text-slate-400")}>
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
