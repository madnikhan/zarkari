import Link from "next/link";
import { getSupplierLedgerBalances } from "@/lib/supplier-ledger/service";
import { formatPrice } from "@/lib/utils";

export default async function SupplierPaymentsPage() {
  const balances = await getSupplierLedgerBalances();

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6">
        <Link href="/admin/suppliers" className="text-sm text-slate-500 hover:text-[#4C3BCF] mb-2 inline-block">
          ← Suppliers
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Supplier Payments</h1>
        <p className="text-sm text-slate-500 mt-1">Khata balances in GBP and PKR for Pakistani suppliers</p>
      </div>

      <div className="boms-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="text-left px-4 py-3 font-medium text-slate-500">Supplier</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Bills (GBP)</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Bills (PKR)</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Paid (GBP)</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Paid (PKR)</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Balance (GBP)</th>
              <th className="text-right px-4 py-3 font-medium text-slate-500">Balance (PKR)</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {balances.map((b) => (
              <tr key={b.supplierId} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">{b.supplierName}</td>
                <td className="px-4 py-3 text-right">{formatPrice(String(b.totalBillsGbp))}</td>
                <td className="px-4 py-3 text-right">Rs {b.totalBillsPkr.toLocaleString("en-GB")}</td>
                <td className="px-4 py-3 text-right">{formatPrice(String(b.totalPaymentsGbp))}</td>
                <td className="px-4 py-3 text-right">Rs {b.totalPaymentsPkr.toLocaleString("en-GB")}</td>
                <td className="px-4 py-3 text-right font-medium">{formatPrice(String(b.balanceGbp))}</td>
                <td className="px-4 py-3 text-right font-medium">Rs {b.balancePkr.toLocaleString("en-GB")}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/suppliers/${b.supplierId}/khata`}
                    className="text-[#4C3BCF] hover:underline text-xs"
                  >
                    View khata →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!balances.length && (
          <p className="text-center text-slate-400 py-12 text-sm">No supplier ledger entries yet.</p>
        )}
      </div>
    </div>
  );
}
