import { PastOrderImportClient } from "@/components/admin/PastOrderImportClient";

export default function PastOrderImportPage() {
  return (
    <div className="p-4 lg:p-8">
      <h1 className="text-2xl font-semibold text-slate-900 mb-2">Import past orders</h1>
      <p className="text-sm text-slate-500 mb-6">
        Bulk CSV import for historical bridal/custom orders (~300+)
      </p>
      <PastOrderImportClient />
    </div>
  );
}
