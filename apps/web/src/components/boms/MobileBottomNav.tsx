"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, PlusCircle, Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Add Order", href: "/admin/orders/new", icon: PlusCircle },
  { label: "Alerts", href: "/admin/notifications", icon: Bell },
  { label: "Menu", href: "/admin/settings", icon: Menu },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 lg:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px]",
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
  const supplierItems = [
    { label: "Orders", href: "/supplier", icon: ShoppingBag },
    { label: "Alerts", href: "/admin/notifications", icon: Bell },
  ];

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
