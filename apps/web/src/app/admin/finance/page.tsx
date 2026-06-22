import { getBridalOrders } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminFinancePage() {
  const session = await getSession();
  if (session?.role !== "owner") redirect("/admin/dashboard");

  const orders = await getBridalOrders();
  const deposits = orders.reduce((s, o) => s + parseFloat(o.depositPaid), 0);
  const outstanding = orders
    .filter((o) => !["cancelled", "refunded", "collected"].includes(o.status))
    .reduce((s, o) => s + parseFloat(o.remainingBalance), 0);
  const refunded = orders.filter((o) => o.status === "refunded").length;

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-3xl text-charcoal mb-8">Finance</h1>
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-lg border border-sand p-6">
          <p className="text-xs text-charcoal/50 uppercase">Deposits Received</p>
          <p className="text-2xl font-semibold mt-2">{formatPrice(String(deposits))}</p>
        </div>
        <div className="bg-white rounded-lg border border-sand p-6">
          <p className="text-xs text-charcoal/50 uppercase">Outstanding Balance</p>
          <p className="text-2xl font-semibold mt-2">{formatPrice(String(outstanding))}</p>
        </div>
        <div className="bg-white rounded-lg border border-sand p-6">
          <p className="text-xs text-charcoal/50 uppercase">Refunded Orders</p>
          <p className="text-2xl font-semibold mt-2">{refunded}</p>
        </div>
      </div>
      <p className="text-xs text-charcoal/50">Owner-only view. Staff cannot access refunds or financial totals.</p>
    </div>
  );
}
