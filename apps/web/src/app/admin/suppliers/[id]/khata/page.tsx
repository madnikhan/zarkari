import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupplier } from "@/lib/data";
import { listSupplierLedger, computeRunningBalances } from "@/lib/supplier-ledger/service";
import { formatPrice } from "@/lib/utils";
import { AddKhataEntryForm } from "@/components/admin/suppliers/AddKhataEntryForm";

interface Props {
  params: Promise<{ id: string }>;
}

const numCell = "px-3 py-2 text-right tabular-nums whitespace-nowrap";

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
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <Link href="/admin/suppliers/payments" className="text-sm text-slate-500 hover:text-[#4C3BCF] mb-2 inline-block">
        ← Supplier Payments
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900 mb-1">{supplier.name} — Khata</h1>
      <p className="text-sm text-slate-500 mb-6">
        Balance: {formatPrice(String(totalBillsGbp - totalPaymentsGbp))} · Rs{" "}
        <span className="font-semibold">{(totalBillsPkr - totalPaymentsPkr).toLocaleString("en-GB")}</span>
      </p>

      <div className="space-y-6 mb-8">
        <AddKhataEntryForm supplierId={id} />

        <div className="boms-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[960px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="text-left px-3 py-2 font-medium text-slate-500">Date</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-500">Type</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-500">Description</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-500">GBP</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-500">PKR</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-500">Rate</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-500">Balance (GBP)</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-500">Balance (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withRunning.map((e) => (
                  <tr key={e.id}>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                      {new Date(e.businessDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-3 py-2 capitalize">{e.type}</td>
                    <td className="px-3 py-2 max-w-xs">
                      <p className="truncate" title={e.description ?? e.billNumber ?? undefined}>
                        {e.description ?? e.billNumber ?? "—"}
                      </p>
                    </td>
                    <td className={numCell}>
                      {e.type === "payment" ? "-" : ""}
                      {formatPrice(e.amountGbp)}
                    </td>
                    <td className={numCell}>
                      {e.type === "payment" ? "-" : ""}Rs {parseFloat(e.amountPkr).toLocaleString("en-GB")}
                    </td>
                    <td className={`${numCell} text-slate-500`}>{e.exchangeRate ?? "—"}</td>
                    <td className={numCell}>{formatPrice(String(e.runningGbp))}</td>
                    <td className={`${numCell} font-semibold bg-violet-50/60 text-slate-800`}>
                      Rs {e.runningPkr.toLocaleString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!withRunning.length && (
            <p className="text-center text-slate-400 py-8 text-sm">No entries yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
