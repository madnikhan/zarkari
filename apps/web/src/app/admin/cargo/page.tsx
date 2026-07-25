import { Suspense } from "react";
import { canDeleteRecords, getSession } from "@/lib/auth/session";
import { CargoPageClient } from "@/components/admin/cargo/CargoPageClient";

export default async function AdminCargoPage() {
  const session = await getSession();
  const canDelete = session ? canDeleteRecords(session.role) : false;

  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-500">Loading cargo records…</p>}>
      <CargoPageClient canDelete={canDelete} />
    </Suspense>
  );
}
