import Link from "next/link";
import { Package, Clock, AlertTriangle, CheckCircle, RotateCcw, ShoppingCart, XCircle, Boxes } from "lucide-react";
import { getBridalOrdersWithRelations, getDashboardStats } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { StatCard } from "@/components/boms/StatCard";
import { OrdersTable } from "@/components/boms/OrdersTable";
import { SocialInboxWidget } from "@/components/admin/inbox/SocialInboxWidget";

export default async function AdminDashboardPage() {
  const session = await getSession();
  const [stats, { orders: recentOrders }] = await Promise.all([
    getDashboardStats(),
    getBridalOrdersWithRelations({ limit: 8 }),
  ]);

  const rows = recentOrders.map((order) => ({
    order,
    customer: order.customerName
      ? { id: order.customerId, name: order.customerName, phone: order.customerPhone ?? "" }
      : null,
    supplierName: order.supplierName,
  }));

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Welcome back, {session?.name}</p>
        </div>
        <Link href="/admin/orders/new" className="boms-btn-primary px-5 py-2.5 rounded-lg text-sm font-medium hidden sm:inline-flex">
          New Order
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-8" data-tour="stat-cards">
        <StatCard label="Total Orders" value={stats.totalOrders} subtitle="All time" href="/admin/orders" icon={Package} />
        <StatCard label="Active Orders" value={stats.totalActive} subtitle="In progress" href="/admin/orders" icon={Clock} accent="default" />
        <StatCard label="Due This Week" value={stats.dueThisWeek} subtitle="Next 7 days" href="/admin/orders?tab=due-week" icon={Clock} accent="warning" />
        <StatCard label="Overdue" value={stats.late} subtitle="Past delivery" href="/admin/orders?tab=overdue" icon={AlertTriangle} accent="danger" />
        <StatCard label="Completed" value={stats.completed} subtitle="Completed" href="/admin/orders?tab=completed" icon={CheckCircle} accent="success" />
        <StatCard label="Refunded" value={stats.refunded} subtitle="This period" href="/admin/orders?tab=refunded" icon={RotateCcw} />
        <StatCard label="Cancelled" value={stats.cancelled} subtitle="Total cancelled" href="/admin/orders?tab=cancelled" icon={XCircle} accent="danger" />
        <StatCard label="Low Stock" value={stats.lowStockItems ?? 0} subtitle="Ready-made sizes" href="/admin/stock" icon={Boxes} accent="warning" />
      </div>

      <SocialInboxWidget />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
        <Link href="/admin/orders?type=online" className="text-xs text-[#4C3BCF] hover:underline flex items-center gap-1">
          <ShoppingCart className="h-3.5 w-3.5" />
          Shop orders
        </Link>
      </div>
      <div data-tour="recent-orders">
      <OrdersTable rows={rows} />
      </div>
    </div>
  );
}
