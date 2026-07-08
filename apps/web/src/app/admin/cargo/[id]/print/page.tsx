import { notFound } from "next/navigation";
import { getCargoBox } from "@/lib/cargo/service";
import { formatPrice } from "@/lib/utils";
import { PrintCargoBoxClient } from "@/components/admin/cargo/PrintCargoBoxClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CargoBoxPrintPage({ params }: Props) {
  const { id } = await params;
  const box = await getCargoBox(id);
  if (!box) notFound();

  const items = box.items ?? [];
  const totalPkr = box.totalCostPkr ?? items.reduce((s, i) => s + parseFloat(i.costPkr || "0"), 0);
  const totalGbp = box.totalCostGbp ?? items.reduce((s, i) => s + parseFloat(i.costGbp || "0"), 0);

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 print:p-6">
      <PrintCargoBoxClient />
      <header className="mb-8 border-b border-slate-200 pb-4">
        <p className="text-xs uppercase tracking-widest text-slate-400">ZARKARI — Cargo &amp; Box Record</p>
        <h1 className="text-2xl font-semibold font-mono text-[#4C3BCF] mt-1">{box.boxNumber}</h1>
        <p className="text-sm text-slate-500 mt-1">Printed {new Date().toLocaleDateString("en-GB")}</p>
      </header>

      <section className="grid grid-cols-2 gap-4 mb-8 text-sm">
        <div>
          <p className="text-xs text-slate-400 uppercase">Received</p>
          <p>{new Date(box.receivedDate).toLocaleDateString("en-GB")}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Cargo company</p>
          <p>{box.cargoCompanyName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Tracking</p>
          <p className="font-mono">{box.trackingNumber}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Weight</p>
          <p>{box.weightKg ? `${box.weightKg} kg` : "—"}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Supplier</p>
          <p>{box.supplierName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase">Exchange rate</p>
          <p>{box.exchangeRate ?? "—"}</p>
        </div>
        {box.notes && (
          <div className="col-span-2">
            <p className="text-xs text-slate-400 uppercase">Notes</p>
            <p>{box.notes}</p>
          </div>
        )}
      </section>

      <table className="w-full text-sm mb-8">
        <thead>
          <tr className="border-b-2 border-slate-200 text-left">
            <th className="py-2 pr-2">Date</th>
            <th className="py-2 pr-2">Article</th>
            <th className="py-2 pr-2">Order No.</th>
            <th className="py-2 pr-2 text-right">PKR</th>
            <th className="py-2 text-right">GBP</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="py-2 pr-2">{new Date(item.itemDate).toLocaleDateString("en-GB")}</td>
              <td className="py-2 pr-2">{item.articleName}</td>
              <td className="py-2 pr-2 font-mono">{item.orderNumber ?? "—"}</td>
              <td className="py-2 pr-2 text-right">Rs {parseFloat(item.costPkr).toLocaleString("en-GB")}</td>
              <td className="py-2 text-right">{formatPrice(item.costGbp)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold border-t-2 border-slate-200">
            <td colSpan={3} className="py-3 pr-2">
              Total ({items.length} items)
            </td>
            <td className="py-3 pr-2 text-right">Rs {totalPkr.toLocaleString("en-GB")}</td>
            <td className="py-3 text-right">{formatPrice(String(totalGbp))}</td>
          </tr>
        </tfoot>
      </table>

      {box.khataEntryId && (
        <p className="text-xs text-emerald-700">Posted to supplier khata</p>
      )}
    </div>
  );
}
