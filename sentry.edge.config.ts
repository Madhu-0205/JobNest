/**
 * Sentry Edge Runtime Configuration
 *
 * The Edge runtime has a restricted API surface (no Node.js built-ins).
 * This minimal config captures errors from:
 *   - Next.js Middleware
 *   - Edge API Routes
 *
 * Only active when NEXT_PUBLIC_SENTRY_DSN is set.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env["SENTRY_DSN"] ?? process.env["NEXT_PUBLIC_SENTRY_DSN"];

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  });
}
