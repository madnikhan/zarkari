const sizeChart = [
  { uk: "6", asian: "XS", bust: "31\"", waist: "24\"", hip: "34\"" },
  { uk: "8", asian: "S", bust: "32\"", waist: "26\"", hip: "36\"" },
  { uk: "10", asian: "M", bust: "34\"", waist: "28\"", hip: "38\"" },
  { uk: "12", asian: "L", bust: "36\"", waist: "30\"", hip: "40\"" },
  { uk: "14", asian: "XL", bust: "38\"", waist: "32\"", hip: "42\"" },
  { uk: "16", asian: "XXL", bust: "40\"", waist: "34\"", hip: "44\"" },
];

export function SizeGuide({ productNote }: { productNote?: string | null }) {
  return (
    <div className="border border-sand p-6 md:p-8">
      <h3 className="font-display text-lg text-charcoal mb-4">Size Guide</h3>
      {productNote && (
        <p className="text-sm text-charcoal/70 mb-6 bg-sand/30 p-4">{productNote}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand">
              <th className="text-left py-3 pr-4 text-xs tracking-widest uppercase text-charcoal/60">UK</th>
              <th className="text-left py-3 pr-4 text-xs tracking-widest uppercase text-charcoal/60">Asian</th>
              <th className="text-left py-3 pr-4 text-xs tracking-widest uppercase text-charcoal/60">Bust</th>
              <th className="text-left py-3 pr-4 text-xs tracking-widest uppercase text-charcoal/60">Waist</th>
              <th className="text-left py-3 text-xs tracking-widest uppercase text-charcoal/60">Hip</th>
            </tr>
          </thead>
          <tbody>
            {sizeChart.map((row) => (
              <tr key={row.uk} className="border-b border-sand/50">
                <td className="py-3 pr-4 font-medium">{row.uk}</td>
                <td className="py-3 pr-4">{row.asian}</td>
                <td className="py-3 pr-4">{row.bust}</td>
                <td className="py-3 pr-4">{row.waist}</td>
                <td className="py-3">{row.hip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-charcoal/50 mt-4">
        Measurements are approximate. For unstitched items, fabric is provided for custom tailoring.
      </p>
    </div>
  );
}
