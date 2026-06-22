import { AnnouncementBar } from "./AnnouncementBar";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { CookieConsent } from "@/components/analytics/CookieConsent";
import { Analytics } from "@/components/analytics/Analytics";
import { getShopSettings } from "@/lib/data";
import { getCart, getCartCount } from "@/lib/cart";

interface StoreLayoutProps {
  children: React.ReactNode;
}

export async function StoreLayout({ children }: StoreLayoutProps) {
  const settings = await getShopSettings();
  const cart = await getCart();
  const cartCount = getCartCount(cart);
  return (
    <>
      <Analytics />
      {settings.announcement && <AnnouncementBar message={settings.announcement} />}
      <Header cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieConsent />
    </>
  );
}
