import { getShopSettings } from "@/lib/data";
import { getSession } from "@/lib/auth/session";
import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { SocialInboxSetupCard } from "@/components/admin/inbox/SocialInboxSetupCard";

export default async function AdminSettingsPage() {
  const settings = await getShopSettings();
  const session = await getSession();
  const isOwner = session?.role === "owner";

  return (
    <div className="p-4 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Settings</h1>

      {isOwner ? (
        <SettingsEditor initial={settings} />
      ) : (
        <div className="boms-card p-6 space-y-4 text-sm">
          <div>
            <label className="text-xs text-slate-500 uppercase">Shop Announcement</label>
            <p className="mt-1">{settings.announcement ?? "—"}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Hero Headline</label>
            <p className="mt-1">{settings.heroHeadline ?? "—"}</p>
          </div>
          <p className="text-xs text-slate-400">Only owners can edit settings.</p>
        </div>
      )}

      <div className="mt-8">
        <SocialInboxSetupCard
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "https://zarkari-web.vercel.app"}
          metaConfigured={Boolean(process.env.META_VERIFY_TOKEN?.trim())}
          waConfigured={Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim())}
        />
      </div>
    </div>
  );
}
