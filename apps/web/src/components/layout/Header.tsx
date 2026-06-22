"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ZarkariLogo } from "@/components/brand/ZarkariLogo";
import { CART_UPDATED_EVENT, fetchCartCount } from "@/lib/cart-client";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Catalogue" },
  { href: "/collections/coming-soon", label: "Coming Soon" },
];

export function Header({ cartCount: initialCartCount = 0 }: { cartCount?: number }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState(initialCartCount);

  const refreshCartCount = useCallback(async () => {
    setCartCount(await fetchCartCount());
  }, []);

  useEffect(() => {
    setCartCount(initialCartCount);
  }, [initialCartCount]);

  useEffect(() => {
    refreshCartCount();
    window.addEventListener(CART_UPDATED_EVENT, refreshCartCount);
    return () => window.removeEventListener(CART_UPDATED_EVENT, refreshCartCount);
  }, [refreshCartCount]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-sand/60",
          mobileOpen ? "bg-cream" : "bg-cream/95 backdrop-blur-md supports-[backdrop-filter]:bg-cream/90"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-16">
            <button
              type="button"
              className="lg:hidden p-2 -ml-2 text-charcoal"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
              <ZarkariLogo size="md" />
            </Link>

            <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs tracking-[0.15em] uppercase text-charcoal/80 hover:text-gold transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/search" className="p-2 text-charcoal hover:text-gold transition-colors" aria-label="Search">
                <Search className="w-5 h-5" />
              </Link>
              <Link
                href="/cart"
                className="relative p-2 text-charcoal hover:text-gold transition-colors"
                aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-gold text-charcoal text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-cream leading-none">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-charcoal/70" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-cream shadow-2xl border-r border-sand flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-sand bg-cream">
              <span className="text-sm font-medium tracking-[0.2em] uppercase text-charcoal">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="p-2 -mr-2 text-charcoal hover:text-gold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex flex-col p-3 bg-cream flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-4 py-4 text-sm font-medium tracking-[0.15em] uppercase text-charcoal bg-cream hover:bg-sand/40 active:bg-sand/60 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/cart"
                className="mt-2 rounded-lg px-4 py-4 text-sm font-medium tracking-[0.15em] uppercase text-charcoal bg-sand/30 hover:bg-sand/50 active:bg-sand/60 transition-colors flex items-center justify-between"
                onClick={() => setMobileOpen(false)}
              >
                Your Bag
                {cartCount > 0 && (
                  <span className="min-w-[22px] h-[22px] px-1.5 bg-gold text-charcoal text-xs font-semibold rounded-full flex items-center justify-center">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
