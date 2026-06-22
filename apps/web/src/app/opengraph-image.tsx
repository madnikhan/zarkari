import { generateBrandOgImage, OG_ALT, OG_SIZE } from "@/lib/og/brand-card";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return generateBrandOgImage();
}
