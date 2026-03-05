import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 2592000, // 30 days — book covers rarely change
    // Tuned for book cover sizes — avoids oversized image generation
    imageSizes: [48, 64, 80, 128, 192],
    deviceSizes: [384, 640, 750, 1080],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
