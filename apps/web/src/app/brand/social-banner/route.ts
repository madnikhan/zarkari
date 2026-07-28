import { generateBrandSocialBannerImage, parseBrandVariant } from "@/lib/og/brand-card";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const variant = parseBrandVariant(searchParams.get("v"));
  return generateBrandSocialBannerImage(variant);
}
