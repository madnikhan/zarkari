import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
