import { BomsShell } from "@/components/boms/BomsShell";
import { MobileBottomNav } from "@/components/boms/MobileBottomNav";
import { PwaInstallBanner } from "@/components/boms/PwaInstallBanner";
import { PushPermissionPrompt } from "@/components/boms/PushPermissionPrompt";
import { TrainingWelcomePrompt } from "@/components/admin/training/TrainingWelcomePrompt";
import { getSession } from "@/lib/auth/session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  manifest: "/manifest-boms.json",
  appleWebApp: { capable: true, title: "ZARKARI BOMS" },
  themeColor: "#4C3BCF",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <BomsShell userName={session?.name} userRole={session?.role}>
        <PushPermissionPrompt variant="staff" />
        <PwaInstallBanner />
        <TrainingWelcomePrompt />
        {children}
      </BomsShell>
      <MobileBottomNav />
    </>
  );
}
