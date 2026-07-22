/**
 * Next.js Instrumentation Entry Point
 *
 * Called ONCE when a new Next.js server instance is initialized.
 * Delegates to runtime-specific initializers:
 *   - Node.js: OTel + Sentry
 *   - Edge:    Sentry only (OTel Node SDK not supported on edge)
 *
 * Reference: https://nextjs.org/docs/app/guides/instrumentation
 */
export async function register() {
  if (process.env['NEXT_RUNTIME'] === "nodejs") {
    await import("./instrumentation.node");
  }

  if (process.env['NEXT_RUNTIME'] === "edge") {
    await import("./sentry.edge.config");
  }
}
