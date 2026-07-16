/**
 * Security headers utility.
 *
 * Central registry of all HTTP security headers used by JobNest.
 * Consumed by `next.config.ts` (static routes) and middleware (dynamic routes).
 *
 * Designed to achieve A+ on securityheaders.io.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SecurityHeader {
  key: string;
  value: string;
}

// ─── Content Security Policy ──────────────────────────────────────────────────

/**
 * Build a strict Content-Security-Policy string.
 *
 * `nonce` is injected per-request by middleware when using strict-dynamic.
 * Pass `undefined` to get the static variant (used in next.config.ts headers).
 */
export function buildCsp(nonce?: string): string {
  const nonceDirective = nonce ? `'nonce-${nonce}'` : "";

  const directives: Record<string, string> = {
    "default-src": "'self'",
    "script-src": [
      "'self'",
      nonceDirective,
      // Allow eval only in development
      process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "",
      "'unsafe-inline'", // required for Next.js inline scripts; remove when strict-dynamic is feasible
    ]
      .filter(Boolean)
      .join(" "),
    "style-src": "'self' 'unsafe-inline'",
    "img-src": "'self' blob: data: https://*.supabase.co https://*.tile.openstreetmap.org",
    "font-src": "'self' https://fonts.gstatic.com",
    "connect-src": [
      "'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://a.tile.openstreetmap.org",
      "https://b.tile.openstreetmap.org",
      "https://c.tile.openstreetmap.org",
      "https://tile.openstreetmap.org",
      "https://nominatim.openstreetmap.org",
      process.env["NEXT_PUBLIC_API_URL"] ?? "",
    ]
      .filter(Boolean)
      .join(" "),
    "media-src": "'self'",
    "worker-src": "'self' blob:",
    "child-src": "'self' blob:",
    "object-src": "'none'",
    "base-uri": "'self'",
    "form-action": "'self'",
    "frame-ancestors": "'none'",
    "upgrade-insecure-requests": "",
  };

  return Object.entries(directives)
    .map(([key, val]) => (val ? `${key} ${val}` : key))
    .join("; ");
}

// ─── Static Security Headers ──────────────────────────────────────────────────

export const SECURITY_HEADERS: SecurityHeader[] = [
  {
    key: "Content-Security-Policy",
    value: buildCsp(),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload", // 2 years
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=(self)", // JobNest uses geolocation with user consent
      "interest-cohort=()",
      "payment=(self)",
      "fullscreen=(self)",
    ].join(", "),
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Embedder-Policy",
    value: "unsafe-none", // 'require-corp' breaks Supabase realtime; set when ready
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

// ─── API-specific Headers ─────────────────────────────────────────────────────

/** Additional headers applied only to /api/* routes */
export const API_HEADERS: SecurityHeader[] = [
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
  { key: "Pragma", value: "no-cache" },
  { key: "X-Robots-Tag", value: "noindex" },
];
