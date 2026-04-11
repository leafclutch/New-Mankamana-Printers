import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack: dramatically faster HMR and cold starts in dev
  turbopack: {},

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    minimumCacheTTL: 3600,
    formats: ["image/webp", "image/avif"],
  },

  compress: true,
  reactStrictMode: true,
};

export default nextConfig;
