import { StoreLayout } from "@/components/layout/StoreLayout";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  return <StoreLayout>{children}</StoreLayout>;
}
