import { Suspense } from "react";
import { CargoPageClient } from "@/components/admin/cargo/CargoPageClient";

export default function AdminCargoPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-500">Loading cargo records…</p>}>
      <CargoPageClient />
    </Suspense>
  );
}
