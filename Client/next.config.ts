import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

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
  // Explicit root prevents monorepo lockfile auto-detection from resolving
  // CSS imports (e.g. "tailwindcss") against the workspace root.
  turbopack: {
    root: projectRoot,
  },
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.modules = [
      path.join(projectRoot, "node_modules"),
      ...(config.resolve.modules ?? []),
    ];
    return config;
  },

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
