import { BomsShell } from "@/components/boms/BomsShell";
import { SupplierMobileNav } from "@/components/boms/MobileBottomNav";
import { getSession } from "@/lib/auth/session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SupplierLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <BomsShell role="supplier" userName={session?.name} userRole="supplier">
        {children}
      </BomsShell>
      <SupplierMobileNav />
    </>
  );
}
