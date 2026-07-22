/**
 * Sentry Server-Side Configuration
 *
 * Initializes error capture for:
 *   - API Route Handlers
 *   - Server Actions
 *   - Server Components
 *   - Background jobs / async operations
 *
 * Only active when SENTRY_DSN is set.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env["SENTRY_DSN"];

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    environment: process.env.NODE_ENV ?? "development",
    release: process.env["COMMIT_SHA"] ?? process.env["npm_package_version"] ?? "0.0.0",

    // Performance: sample 10% of transactions in production, 100% in dev
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Integrations: Sentry automatically instruments Next.js, fetch, and DB calls
    integrations: [
      Sentry.consoleIntegration({ levels: ["error", "warn"] }),
    ],

    // Filter out noisy or non-actionable errors
    beforeSend(event, hint) {
      // Drop client-side navigation aborts (not real errors)
      const err = hint.originalException;
      if (err instanceof Error && err.message?.includes("AbortError")) return null;
      return event;
    },

    // Don't send PII by default
    sendDefaultPii: false,
  });
} else {
  // Warn in production; in development this is expected
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[Sentry] SENTRY_DSN is not set. Error reporting is DISABLED. " +
        "Configure SENTRY_DSN in your environment to enable Sentry."
    );
  }
}
