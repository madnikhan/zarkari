import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupplier } from "@/lib/data";
import { listSupplierLedger, computeRunningBalances } from "@/lib/supplier-ledger/service";
import { formatPrice } from "@/lib/utils";
import { AddKhataEntryForm } from "@/components/admin/suppliers/AddKhataEntryForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SupplierKhataPage({ params }: Props) {
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) notFound();

  const entries = await listSupplierLedger(id);
  const withRunning = computeRunningBalances(entries).reverse();

  const totalBillsGbp = entries
    .filter((e) => e.type !== "payment")
    .reduce((s, e) => s + parseFloat(e.amountGbp), 0);
  const totalPaymentsGbp = entries
    .filter((e) => e.type === "payment")
    .reduce((s, e) => s + parseFloat(e.amountGbp), 0);
  const totalBillsPkr = entries
    .filter((e) => e.type !== "payment")
    .reduce((s, e) => s + parseFloat(e.amountPkr), 0);
  const totalPaymentsPkr = entries
    .filter((e) => e.type === "payment")
    .reduce((s, e) => s + parseFloat(e.amountPkr), 0);

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <Link href="/admin/suppliers/payments" className="text-sm text-slate-500 hover:text-[#4C3BCF] mb-2 inline-block">
        ← Supplier Payments
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">{supplier.name} — Khata</h1>
      <p className="text-sm text-slate-500 mb-6">
        Balance: {formatPrice(String(totalBillsGbp - totalPaymentsGbp))} · Rs{" "}
        {(totalBillsPkr - totalPaymentsPkr).toLocaleString("en-GB")}
      </p>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <AddKhataEntryForm supplierId={id} />
        </div>
        <div className="lg:col-span-2 boms-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="text-left px-3 py-2 font-medium text-slate-500">Date</th>
                <th className="text-left px-3 py-2 font-medium text-slate-500">Type</th>
                <th className="text-left px-3 py-2 font-medium text-slate-500">Description</th>
                <th className="text-right px-3 py-2 font-medium text-slate-500">GBP</th>
                <th className="text-right px-3 py-2 font-medium text-slate-500">PKR</th>
                <th className="text-right px-3 py-2 font-medium text-slate-500">Rate</th>
                <th className="text-right px-3 py-2 font-medium text-slate-500">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {withRunning.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 text-slate-600">{new Date(e.businessDate).toLocaleDateString("en-GB")}</td>
                  <td className="px-3 py-2 capitalize">{e.type}</td>
                  <td className="px-3 py-2">
                    <p>{e.description ?? e.billNumber ?? "—"}</p>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {e.type === "payment" ? "-" : ""}
                    {formatPrice(e.amountGbp)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {e.type === "payment" ? "-" : ""}Rs {parseFloat(e.amountPkr).toLocaleString("en-GB")}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500">{e.exchangeRate ?? "—"}</td>
                  <td className="px-3 py-2 text-right text-xs text-slate-500">
                    {formatPrice(String(e.runningGbp))}
                    <br />
                    Rs {e.runningPkr.toLocaleString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!withRunning.length && (
            <p className="text-center text-slate-400 py-8 text-sm">No entries yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
