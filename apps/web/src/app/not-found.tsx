import Link from "next/link";
import { StoreLayout } from "@/components/layout/StoreLayout";

export default function NotFound() {
  return (
    <StoreLayout>
      <section className="py-32 text-center">
        <div className="max-w-md mx-auto px-4">
          <h1 className="font-display text-6xl text-charcoal mb-4">404</h1>
          <p className="text-charcoal/60 mb-8">This page could not be found.</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-4 bg-charcoal text-cream text-xs tracking-[0.2em] uppercase hover:bg-gold hover:text-charcoal transition-colors"
          >
            Return Home
          </Link>
        </div>
      </section>
    </StoreLayout>
  );
}
