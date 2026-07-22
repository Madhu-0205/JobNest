/**
 * Sentry Client-Side Configuration
 *
 * Initializes Sentry in the browser for:
 *   - Unhandled JS exceptions
 *   - React error boundaries
 *   - Session replay (10% sessions, 100% error sessions)
 *
 * Only active when NEXT_PUBLIC_SENTRY_DSN is set.
 * This file is imported via instrumentation and Next.js App Router layout.
 */

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env["NEXT_PUBLIC_SENTRY_DSN"];

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    environment: process.env.NODE_ENV ?? "development",
    release: process.env["NEXT_PUBLIC_COMMIT_SHA"] ?? "0.0.0",

    // Performance
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session Replay — records user sessions for debugging
    replaysSessionSampleRate: 0.1,    // 10% of all sessions
    replaysOnErrorSampleRate: 1.0,    // 100% of sessions with errors

    integrations: [
      Sentry.replayIntegration({
        // Mask all text and block all media by default (GDPR-friendly)
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Don't send PII
    sendDefaultPii: false,
  });
}
