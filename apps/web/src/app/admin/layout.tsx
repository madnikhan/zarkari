import { BomsShell } from "@/components/boms/BomsShell";
import { MobileBottomNav } from "@/components/boms/MobileBottomNav";
import { SampleDataBanner } from "@/components/admin/SampleDataBanner";
import { getSession } from "@/lib/auth/session";
import { hasSampleData } from "@/lib/data/sample-status";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const showSampleBanner = await hasSampleData();
  return (
    <>
      <BomsShell userName={session?.name} userRole={session?.role}>
        {showSampleBanner && <SampleDataBanner />}
        {children}
      </BomsShell>
      <MobileBottomNav />
    </>
  );
}
