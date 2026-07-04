import { WhatsAppButton } from "@/components/boms/WhatsAppButton";

interface Props {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  orderNumber?: string;
}

export function CustomerCard({ name, phone, email, address, orderNumber }: Props) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="boms-card p-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Customer Info</h3>
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-[#4C3BCF]/10 text-[#4C3BCF] text-xl font-semibold flex items-center justify-center flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-lg">{name}</p>
          {phone && <p className="text-sm text-slate-600 mt-0.5">{phone}</p>}
          {email && <p className="text-sm text-slate-500">{email}</p>}
          {address && <p className="text-sm text-slate-500 mt-1">{address}</p>}
          {phone && (
            <div className="mt-3">
              <WhatsAppButton phone={phone} customerName={name} orderNumber={orderNumber} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
