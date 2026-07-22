import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./lib/security/headers";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,

  // ── Image Optimization ─────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },

  // ── Security Headers ───────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
      {
        // Additional cache-busting headers for API routes
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },

  // ── Performance ────────────────────────────────────────────────────────────
  compress: true,

  // ── Logging ────────────────────────────────────────────────────────────────
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
};

export default withSentryConfig(nextConfig, {
  // ── Sentry Build Plugin ────────────────────────────────────────────────────
  org: process.env["SENTRY_ORG"] ?? "jobnest",
  project: process.env["SENTRY_PROJECT"] ?? "jobnest-nextjs",

  // Silent in dev to avoid noisy build output
  silent: process.env.NODE_ENV !== "production",

  // Tunnels Sentry requests through /api/monitoring to avoid ad-blockers
  tunnelRoute: "/api/monitoring",

  // Webpack-specific Sentry options (replaces deprecated top-level options)
  webpack: {
    // Automatically wrap Server Actions with Sentry error capture
    autoInstrumentServerFunctions: true,
    // Tree-shake Sentry debug logging in production bundles
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
