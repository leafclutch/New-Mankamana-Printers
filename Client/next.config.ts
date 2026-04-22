import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Turbopack: dramatically faster HMR and cold starts in dev
  turbopack: {},

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "**.supabase.co", pathname: "/**" },
      { protocol: "https", hostname: "hvvdnlsrwpenyulgfgsz.supabase.co", pathname: "/**" },
      { protocol: "http",  hostname: "**.supabase.co", pathname: "/**" },
      { protocol: "http",  hostname: "localhost", pathname: "/**" },
    ],
    // Cache images longer in production
    minimumCacheTTL: 3600,
    formats: ["image/webp", "image/avif"],
  },

  // Compress responses
  compress: true,

  // Suppress noisy hydration logs in dev
  reactStrictMode: true,

  // Reduce bundle size by excluding server-only code from client bundle
  serverExternalPackages: [],
};

export default nextConfig;
