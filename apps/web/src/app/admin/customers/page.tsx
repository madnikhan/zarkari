import Link from "next/link";
import { getBridalOrders, getCustomer, getCustomers } from "@/lib/data";

export default async function AdminCustomersPage() {
  const customers = await getCustomers();
  const orders = await getBridalOrders();

  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-3xl text-charcoal mb-8">Customers</h1>
      <div className="space-y-4">
        {customers.map((c) => {
          const customerOrders = orders.filter((o) => o.customerId === c.id);
          return (
            <div key={c.id} className="bg-white rounded-lg border border-sand p-5">
              <p className="font-medium text-charcoal">{c.name}</p>
              <p className="text-sm text-charcoal/60">{c.phone} · {c.email}</p>
              <p className="text-xs text-charcoal/50 mt-2">{customerOrders.length} bridal order(s)</p>
              <ul className="mt-3 space-y-1">
                {customerOrders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`} className="text-sm text-gold hover:underline font-mono">
                      {o.orderNumber}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
