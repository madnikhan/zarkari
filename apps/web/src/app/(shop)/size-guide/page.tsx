import { SizeGuide } from "@/components/product/SizeGuide";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Size Guide" };

export default function SizeGuidePage() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <p className="text-gold text-xs tracking-[0.3em] uppercase mb-3">Fit Guide</p>
        <h1 className="font-display text-4xl text-charcoal mb-8">Size Guide</h1>
        <p className="text-charcoal/70 mb-10 leading-relaxed max-w-2xl">
          Every ZARKARI piece is tailor-made to your measurements. Select a standard size on the product page or enter
          custom measurements for a perfect fit.
        </p>
        <SizeGuide />
      </div>
    </section>
  );
}
