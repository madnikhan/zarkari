import { ZarkariLogo } from "@/components/brand/ZarkariLogo";
import { PushPermissionPrompt } from "@/components/boms/PushPermissionPrompt";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="boms-theme min-h-screen">
      <header className="bg-[#2d2a6e] text-white px-4 py-5 text-center">
        <ZarkariLogo size="md" variant="light" className="mx-auto" />
        <p className="text-[10px] text-white/50 mt-2 uppercase tracking-widest">My Bridal Order</p>
      </header>
      <main className="max-w-lg mx-auto px-4 py-8">{children}</main>
      <PushPermissionPrompt variant="customer" />
    </div>
  );
}
