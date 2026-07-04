import { BomsShell } from "@/components/boms/BomsShell";
import { SupplierMobileNav } from "@/components/boms/MobileBottomNav";
import { PwaInstallBanner } from "@/components/boms/PwaInstallBanner";
import { getSession } from "@/lib/auth/session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  manifest: "/manifest-boms.json",
  themeColor: "#4C3BCF",
};

export default async function SupplierLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <BomsShell role="supplier" userName={session?.name} userRole="supplier">
        <PwaInstallBanner />
        {children}
      </BomsShell>
      <SupplierMobileNav />
    </>
  );
}
