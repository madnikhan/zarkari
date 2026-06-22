import { getShopSettings } from "@/lib/data";

export default async function AdminSettingsPage() {
  const settings = await getShopSettings();

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Settings</h1>
      <div className="boms-card p-6 space-y-6">
        <div>
          <label className="text-xs text-slate-500 uppercase">Shop Announcement</label>
          <p className="mt-1 text-sm">{settings.announcement ?? "—"}</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase">Hero Headline</label>
          <p className="mt-1 text-sm">{settings.heroHeadline ?? "—"}</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase">WhatsApp Number</label>
          <p className="mt-1 text-sm font-mono">{process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "Not configured"}</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase">Default Deposit</label>
          <p className="mt-1 text-sm">50% at booking</p>
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase">Free Shipping Threshold</label>
          <p className="mt-1 text-sm">£75 (online shop)</p>
        </div>
        <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
          Full settings editor coming soon. Configure env vars for WhatsApp and Stripe in production.
        </p>
      </div>
    </div>
  );
}
