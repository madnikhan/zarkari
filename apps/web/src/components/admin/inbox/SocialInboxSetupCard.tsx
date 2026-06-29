import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

const CHECKLIST = [
  { label: "Create Meta Developer App (Business type)", href: "https://developers.facebook.com" },
  { label: "Add Messenger, Instagram, and WhatsApp products" },
  { label: "Set webhook: /api/webhooks/meta", env: "META_VERIFY_TOKEN" },
  { label: "Set webhook: /api/webhooks/whatsapp", env: "WHATSAPP_VERIFY_TOKEN" },
  { label: "Add META_PAGE_ACCESS_TOKEN for FB/IG replies", env: "META_PAGE_ACCESS_TOKEN" },
  { label: "Add WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN", env: "WHATSAPP_ACCESS_TOKEN" },
  { label: "Run npm run db:push for inbox tables" },
  { label: "Submit Meta App Review (pages_messaging, instagram_manage_messages)" },
];

interface Props {
  siteUrl: string;
  metaConfigured: boolean;
  waConfigured: boolean;
}

export function SocialInboxSetupCard({ siteUrl, metaConfigured, waConfigured }: Props) {
  return (
    <div className="boms-card p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Social Inbox Setup</h2>
        <Link href="/admin/inbox" className="text-sm text-[#4C3BCF] hover:underline">
          Open inbox
        </Link>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Connect Facebook, Instagram, and WhatsApp for automatic message sync. TikTok and other platforms use manual logging.
      </p>
      <div className="grid sm:grid-cols-2 gap-2 mb-4 text-sm">
        <div className={`rounded-lg px-3 py-2 ${metaConfigured ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          Meta webhooks: {metaConfigured ? "Configured" : "Not configured"}
        </div>
        <div className={`rounded-lg px-3 py-2 ${waConfigured ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          WhatsApp API: {waConfigured ? "Configured" : "Not configured"}
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {CHECKLIST.map((item) => (
          <li key={item.label} className="flex items-start gap-2">
            <Circle className="h-4 w-4 text-slate-300 mt-0.5 flex-shrink-0" />
            <span>
              {item.href ? (
                <a href={item.href} target="_blank" rel="noreferrer" className="text-[#4C3BCF] hover:underline">
                  {item.label}
                </a>
              ) : (
                item.label
              )}
              {item.env && <span className="text-slate-400 ml-1">({item.env})</span>}
            </span>
          </li>
        ))}
        <li className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
          <span>
            Webhook URLs: <code className="text-xs bg-slate-100 px-1 rounded">{siteUrl}/api/webhooks/meta</code>
          </span>
        </li>
      </ul>
      <Link href="/docs/meta-inbox-setup.md" className="inline-block mt-4 text-sm text-[#4C3BCF] hover:underline">
        Full setup guide →
      </Link>
    </div>
  );
}
