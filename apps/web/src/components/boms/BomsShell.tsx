"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Users,
  Truck,
  Calendar,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  UserCog,
  LogOut,
  Menu,
  X,
  Inbox,
  Wallet,
  FileText,
  Banknote,
  GraduationCap,
  HelpCircle,
  Package,
} from "lucide-react";
import { useState } from "react";
import { ZarkariLogo } from "@/components/brand/ZarkariLogo";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
  dataTour?: string;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

const adminNavSections: NavSection[] = [
  {
    items: [{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Orders & stock",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
      { label: "New Order", href: "/admin/orders/new", icon: PlusCircle },
      { label: "Stock", href: "/admin/stock", icon: Package },
      { label: "Inbox", href: "/admin/inbox", icon: Inbox },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Daily Cash", href: "/admin/cash", icon: Banknote },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
    ],
  },
  {
    title: "People",
    items: [{ label: "Customers", href: "/admin/customers", icon: Users }],
  },
  {
    title: "Suppliers",
    items: [
      { label: "Suppliers", href: "/admin/suppliers", icon: Truck },
      { label: "Cargo & Boxes", href: "/admin/cargo", icon: Package, dataTour: "nav-cargo" },
      { label: "Supplier Payments", href: "/admin/suppliers/payments", icon: Wallet },
    ],
  },
  {
    title: "Storefront",
    items: [{ label: "Content", href: "/admin/content", icon: FileText }],
  },
  {
    title: "Planning",
    items: [
      { label: "Calendar", href: "/admin/calendar", icon: Calendar },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Training", href: "/admin/training", icon: GraduationCap },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Users", href: "/admin/users", icon: UserCog, ownerOnly: true },
    ],
  },
];

interface BomsShellProps {
  children: React.ReactNode;
  role?: "admin" | "supplier";
  userName?: string;
  userRole?: string;
  supplierId?: string;
}

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/admin/dashboard" || href === "/admin/orders" || href === "/supplier") return false;
  return pathname.startsWith(href);
}

export function BomsShell({
  children,
  role = "admin",
  userName,
  userRole,
  supplierId,
}: BomsShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isOwner = userRole === "owner";

  const supplierNav: NavItem[] = [
    { label: "Order history", href: "/supplier", icon: LayoutDashboard },
    { label: "Orders", href: "/supplier", icon: ShoppingBag },
  ];

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  function renderNavItem(item: NavItem) {
    if (item.ownerOnly && !isOwner) return null;
    const active = isNavActive(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        onClick={() => setSidebarOpen(false)}
        data-tour={item.dataTour ?? `nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
          active ? "bg-[#4C3BCF] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {item.label}
      </Link>
    );
  }

  return (
    <div className="boms-theme flex min-h-screen">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "boms-sidebar fixed lg:static inset-y-0 left-0 z-50 w-64 text-white flex flex-col transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-white/10">
          <Link href={role === "supplier" ? "/supplier" : "/admin/dashboard"} onClick={() => setSidebarOpen(false)}>
            <ZarkariLogo size="sm" variant="light" />
            <p className="text-[10px] text-white/50 mt-2 uppercase tracking-widest">
              {role === "supplier" ? "Supplier Portal" : "Order Management"}
            </p>
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {role === "supplier" ? (
            <div className="space-y-1">{supplierNav.map(renderNavItem)}</div>
          ) : (
            adminNavSections.map((section, idx) => (
              <div key={section.title ?? `section-${idx}`}>
                {section.title && (
                  <p
                    className={cn(
                      "px-3 pb-1 text-[10px] uppercase tracking-widest text-white/40",
                      idx === 0 ? "pt-0" : "pt-4"
                    )}
                  >
                    {section.title}
                  </p>
                )}
                <div className="space-y-1">{section.items.map(renderNavItem)}</div>
              </div>
            ))
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-4 flex items-center gap-4 sticky top-0 z-30">
          <button
            type="button"
            className="lg:hidden p-2 -ml-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          {sidebarOpen && (
            <button
              type="button"
              className="lg:hidden p-2"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="flex-1 hidden md:block">
            <input
              type="search"
              placeholder="Search Order ID, Customer, Phone..."
              className="w-full max-w-md px-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4C3BCF]/30"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = (e.target as HTMLInputElement).value;
                  if (q.trim()) window.location.href = `/admin/search?q=${encodeURIComponent(q.trim())}`;
                }
              }}
            />
          </div>

          <span className="hidden sm:block text-xs text-slate-500">{today}</span>
          {role === "admin" && (
            <Link
              href="/admin/training"
              className="p-2 text-slate-500 hover:text-[#4C3BCF] rounded-lg hover:bg-slate-50"
              aria-label="Help and training"
              title="Help & Training"
            >
              <HelpCircle className="h-5 w-5" />
            </Link>
          )}
          <NotificationBell role={role} supplierId={supplierId} />
          {userName && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="h-8 w-8 rounded-full bg-[#4C3BCF] text-white text-xs flex items-center justify-center font-medium">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs text-slate-400 capitalize">{userRole ?? "staff"}</p>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 pb-20 lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
