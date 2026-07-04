import { BomsShell } from "@/components/boms/BomsShell";
import { MobileBottomNav } from "@/components/boms/MobileBottomNav";
import { SampleDataBanner } from "@/components/admin/SampleDataBanner";
import { PwaInstallBanner } from "@/components/boms/PwaInstallBanner";
import { PwaServiceWorkerRegister } from "@/components/boms/PwaServiceWorkerRegister";
import { TrainingWelcomePrompt } from "@/components/admin/training/TrainingWelcomePrompt";
import { getSession } from "@/lib/auth/session";
import { hasSampleData } from "@/lib/data/sample-status";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  manifest: "/manifest-boms.json",
  appleWebApp: { capable: true, title: "ZARKARI BOMS" },
  themeColor: "#4C3BCF",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, showSampleBanner] = await Promise.all([getSession(), hasSampleData()]);
  return (
    <>
      <BomsShell userName={session?.name} userRole={session?.role}>
        <PwaServiceWorkerRegister />
        <PwaInstallBanner />
        <TrainingWelcomePrompt />
        {showSampleBanner && <SampleDataBanner />}
        {children}
      </BomsShell>
      <MobileBottomNav />
    </>
  );
}
