import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Montserrat } from "next/font/google";
import Script from "next/script";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  getOgImageUrls,
  getSiteUrl,
  SITE_NAME,
} from "@/lib/seo/site-metadata";
import { OG_ALT, OG_SIZE } from "@/lib/og/brand-card";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const fontLogo = Montserrat({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["100"],
});

const siteUrl = getSiteUrl();
const ogImages = getOgImageUrls();

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: { default: DEFAULT_TITLE, template: "%s | ZARKARI" },
  description: DEFAULT_DESCRIPTION,
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: SITE_NAME },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: siteUrl,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: ogImages.openGraph,
        secureUrl: ogImages.openGraph,
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        alt: OG_ALT,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [ogImages.twitter],
  },
};

export const viewport: Viewport = {
  themeColor: "#c9a962",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${cormorant.variable} ${fontLogo.variable} h-full`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col antialiased bg-cream text-charcoal">
        {children}
        <Script id="sw-cleanup" strategy="afterInteractive">
          {`if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(x){x.unregister()})});if('caches' in window){caches.keys().then(function(k){k.forEach(function(n){caches.delete(n)})})}}`}
        </Script>
      </body>
    </html>
  );
}
