import { generateBrandSocialBannerImage } from "@/lib/og/brand-card";

export const runtime = "edge";

export async function GET() {
  return generateBrandSocialBannerImage();
}
