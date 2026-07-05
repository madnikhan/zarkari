import type { NextConfig } from "next";

function buildImageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "*.r2.dev",
      pathname: "/**",
    },
    {
      protocol: "https",
      hostname: "files.zarkari.co.uk",
      pathname: "/**",
    },
  ];

  const publicUrl = process.env.R2_PUBLIC_URL?.trim();
  if (publicUrl) {
    try {
      const host = new URL(publicUrl).hostname;
      if (!patterns.some((p) => p.hostname === host)) {
        patterns.push({ protocol: "https", hostname: host, pathname: "/**" });
      }
    } catch {
      // ignore invalid R2_PUBLIC_URL at build time
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["ffmpeg-static"],
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },
  allowedDevOrigins: ["*.trycloudflare.com"],
  async redirects() {
    return [
      {
        source: "/zarkari-sparrow.png",
        destination: "/icon.svg",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
