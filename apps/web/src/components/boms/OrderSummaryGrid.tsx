import { formatPrice } from "@/lib/utils";

interface Row {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}

interface Props {
  rows: Row[];
}

export function OrderSummaryGrid({ rows }: Props) {
  return (
    <div className="boms-card p-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Order Summary</h3>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4 text-sm border-b border-slate-50 pb-3 last:border-0 last:pb-0">
            <dt className="text-slate-500">{row.label}</dt>
            <dd className={`font-medium text-right ${row.highlight ? "text-[#4C3BCF] font-semibold" : "text-slate-900"}`}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB");
}

export { formatPrice };
