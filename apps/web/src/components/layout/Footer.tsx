import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { ZarkariLogo } from "@/components/brand/ZarkariLogo";
import {
  STORE_ADDRESS_ONE_LINE,
  STORE_PHONE_DISPLAY,
  STORE_SITE_URL,
  getPublicWhatsAppDigits,
} from "@/lib/brand/store-contact";

const footerLinks = {
  shop: [
    { href: "/", label: "Catalogue" },
    { href: "/collections/coming-soon", label: "Coming Soon" },
  ],
  help: [
    { href: "/pages/shipping", label: "Shipping" },
    { href: "/pages/returns", label: "Returns" },
    { href: "/pages/contact", label: "Contact" },
  ],
  about: [{ href: "/pages/about", label: "Our Story" }],
};

export function Footer() {
  const whatsapp = getPublicWhatsAppDigits();

  return (
    <footer className="bg-charcoal text-cream mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="mb-4">
              <ZarkariLogo size="md" variant="light" />
            </div>
            <p className="text-cream/60 text-sm leading-relaxed mb-3">
              Designer formal wear from the ZARKARI catalogue.
            </p>
            <p className="text-cream/60 text-sm leading-relaxed mb-1">{STORE_ADDRESS_ONE_LINE}</p>
            <p className="text-cream/60 text-sm mb-3">
              <a
                href={`tel:${STORE_PHONE_DISPLAY.replace(/\s/g, "")}`}
                className="hover:text-gold transition-colors"
              >
                {STORE_PHONE_DISPLAY}
              </a>
            </p>
            <a
              href={STORE_SITE_URL}
              className="block text-sm text-cream/60 hover:text-gold transition-colors mb-3"
            >
              {STORE_SITE_URL.replace(/^https?:\/\//, "")}
            </a>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-cream/60 hover:text-gold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            )}
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-xs tracking-[0.2em] uppercase text-gold mb-3">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream/60 hover:text-cream transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-cream/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-cream/40">
            &copy; {new Date().getFullYear()} ZARKARI. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-cream/40">
            <Link href="/pages/privacy" className="hover:text-cream transition-colors">
              Privacy
            </Link>
            <Link href="/pages/terms" className="hover:text-cream transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
