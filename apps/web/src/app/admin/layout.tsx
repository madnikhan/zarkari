import { BomsShell } from "@/components/boms/BomsShell";
import { MobileBottomNav } from "@/components/boms/MobileBottomNav";
import { getSession } from "@/lib/auth/session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <BomsShell userName={session?.name} userRole={session?.role}>
        {children}
      </BomsShell>
      <MobileBottomNav />
    </>
  );
}
