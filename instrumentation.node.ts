/**
 * Node.js OTel + Sentry Initialization
 *
 * Loaded by instrumentation.ts only when NEXT_RUNTIME === 'nodejs'.
 * Initializes:
 *   1. @vercel/otel — auto-instruments HTTP, fetch, Server Actions, Supabase calls
 *   2. @sentry/nextjs — error capture + performance tracing
 *
 * Environment variables:
 *   OTEL_EXPORTER_OTLP_ENDPOINT — where to export spans (e.g., https://otel.honeycomb.io)
 *   OTEL_EXPORTER_OTLP_HEADERS  — auth headers for the collector
 *   SENTRY_DSN                  — Sentry project DSN
 */

import { registerOTel } from "@vercel/otel";

// ── OpenTelemetry ──────────────────────────────────────────────────────────────
registerOTel({
  serviceName: "jobnest",
  // When OTEL_EXPORTER_OTLP_ENDPOINT is set, @vercel/otel automatically
  // exports spans to the configured collector (Jaeger, Honeycomb, Grafana, etc.).
  // No additional config needed — the env var is the only required switch.
  attributes: {
    "service.version": process.env["npm_package_version"] ?? "0.0.0",
    "deployment.environment": process.env.NODE_ENV ?? "development",
    "service.namespace": "jobnest-platform",
    "commit.sha": process.env["COMMIT_SHA"] ?? "unknown",
  },
});

// ── Sentry ─────────────────────────────────────────────────────────────────────
// Import server-side Sentry config (registers error capture, performance)
import "./sentry.server.config";
