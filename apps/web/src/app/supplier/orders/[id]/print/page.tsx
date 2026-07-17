import { notFound, redirect } from "next/navigation";
import { getBridalOrderById, getCustomer, getOrderFiles } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { getCountdown } from "@/lib/orders/status-machine";
import { getCustomerStatusLabel } from "@/lib/orders/status-machine";
import { MeasurementsReadOnly } from "@/components/orders/MeasurementsReadOnly";
import { PrintSupplierOrderClient } from "@/components/supplier/PrintSupplierOrderClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SupplierOrderPrintPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.supplierId) redirect("/login");

  const order = await getBridalOrderById(id);
  if (!order || order.supplierId !== session.supplierId) notFound();

  const [customer, files] = await Promise.all([
    getCustomer(order.customerId),
    getOrderFiles(order.id, true),
  ]);

  const countdown = getCountdown(order.deliveryDate);
  const designFiles = files.filter((f) => f.category === "design");
  const measurementFiles = files.filter((f) => f.category === "measurements");

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 print:p-6 max-w-2xl mx-auto">
      <PrintSupplierOrderClient />

      <header className="mb-6 border-b border-slate-200 pb-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">ZARKARI — Supplier order sheet</p>
        <h1 className="text-2xl font-semibold font-mono text-[#4C3BCF] mt-1">{order.orderNumber}</h1>
        <p className="text-sm text-slate-600 mt-1">{customer?.name ?? "Customer"}</p>
        <p className="text-xs text-slate-500 mt-1">Printed {new Date().toLocaleDateString("en-GB")}</p>
      </header>

      <section className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <p className="text-xs text-slate-400 uppercase">Due date</p>
          <p className="font-medium">{new Date(order.deliveryDate).toLocaleDateString("en-GB")}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Days remaining</p>
          <p className="font-medium">{countdown.label}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Status</p>
          <p>{getCustomerStatusLabel(order.status)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Dress type</p>
          <p>{order.dressType ?? "—"}</p>
        </div>
      </section>

      {(order.customisationNotes || order.comments) && (
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase text-slate-500 mb-2">Customisation notes</h2>
          <p className="text-sm whitespace-pre-wrap border border-slate-200 rounded-lg p-3 bg-slate-50">
            {order.customisationNotes || order.comments}
          </p>
        </section>
      )}

      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase text-slate-500 mb-3">Measurements</h2>
        <MeasurementsReadOnly measurements={order.measurements} showEmpty />
      </section>

      {(designFiles.length > 0 || measurementFiles.length > 0) && (
        <section className="mb-6 text-sm">
          <h2 className="text-xs font-semibold uppercase text-slate-500 mb-2">Attached files</h2>
          <ul className="space-y-1">
            {designFiles.map((f) => (
              <li key={f.id}>
                Design: {f.fileName}
              </li>
            ))}
            {measurementFiles.map((f) => (
              <li key={f.id}>
                Measurements: {f.fileName}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
