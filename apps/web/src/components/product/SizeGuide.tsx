import {
  MEASUREMENT_FIELDS,
  STANDARD_SIZE_CHART,
  formatInches,
} from "@/lib/sizing";

export function SizeGuide({ productNote }: { productNote?: string | null }) {
  return (
    <div className="border border-sand p-6 md:p-8">
      <h3 className="font-display text-lg text-charcoal mb-4">Size Guide</h3>
      {productNote && (
        <p className="text-sm text-charcoal/70 mb-6 bg-sand/30 p-4">{productNote}</p>
      )}
      <p className="text-sm text-charcoal/70 mb-6 leading-relaxed">
        ZARKARI formal wear is tailor-made. Choose a standard size below or enter your own measurements on the product page.
        All measurements are in inches.
      </p>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-sand">
              <th className="text-left py-3 pr-3 text-xs tracking-widest uppercase text-charcoal/60 sticky left-0 bg-cream">
                Size
              </th>
              <th className="text-left py-3 pr-3 text-xs tracking-widest uppercase text-charcoal/60">UK</th>
              {MEASUREMENT_FIELDS.map((field) => (
                <th
                  key={field.key}
                  className="text-left py-3 pr-3 text-xs tracking-widest uppercase text-charcoal/60 whitespace-nowrap"
                >
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STANDARD_SIZE_CHART.map((row) => (
              <tr key={row.size} className="border-b border-sand/50">
                <td className="py-3 pr-3 font-medium sticky left-0 bg-cream">{row.size}</td>
                <td className="py-3 pr-3">{row.uk}</td>
                {MEASUREMENT_FIELDS.map((field) => (
                  <td key={field.key} className="py-3 pr-3 whitespace-nowrap">
                    {formatInches(row.measurements[field.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="text-xs tracking-[0.2em] uppercase text-charcoal mb-4">How to measure</h4>
      <p className="text-sm text-charcoal/60 mb-4">
        Measure yourself head to toe in inches, wearing fitted undergarments. Stand straight with arms relaxed.
      </p>
      <ol className="space-y-4">
        {MEASUREMENT_FIELDS.map((field, index) => (
          <li key={field.key} className="text-sm">
            <span className="font-medium text-charcoal">
              {index + 1}. {field.label}
            </span>
            <p className="text-charcoal/60 mt-0.5 leading-relaxed">{field.howTo}</p>
          </li>
        ))}
      </ol>
      <p className="text-xs text-charcoal/50 mt-6">
        Measurements are approximate for standard sizes. Custom tailoring uses your exact measurements.
      </p>
    </div>
  );
}
