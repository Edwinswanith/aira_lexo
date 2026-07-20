import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.airalexo.in" }],
        destination: "https://airalexo.in/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
