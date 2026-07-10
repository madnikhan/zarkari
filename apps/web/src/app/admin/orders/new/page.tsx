import { getSuppliers } from "@/lib/data";
import { NewOrderForm } from "@/components/admin/NewOrderForm";

export default async function NewOrderPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">New Order</h1>
      <NewOrderForm suppliers={suppliers} />
      <p className="text-xs text-slate-400 mt-4">50% deposit · 8-week default delivery</p>
    </div>
  );
}
