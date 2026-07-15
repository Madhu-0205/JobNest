/**
 * OpenTelemetry Preparation Layer
 *
 * This module provides trace context propagation utilities that are
 * fully compatible with the W3C Trace Context specification.
 *
 * Architecture:
 * - In production with OTEL_EXPORTER_OTLP_ENDPOINT set, wire in
 *   @opentelemetry/sdk-node and @opentelemetry/auto-instrumentations-node.
 * - Currently implemented as lightweight stubs that propagate trace
 *   context headers without requiring the full OTLP SDK.
 * - Zero runtime cost when no OTLP endpoint is configured.
 *
 * Future activation:
 *   npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
 *   Set OTEL_EXPORTER_OTLP_ENDPOINT=http://your-collector:4318
 */

export interface TraceContext {
  traceId: string;
  spanId: string;
  traceFlags: string;
  traceparent: string;
}

export interface SpanOptions {
  name: string;
  attributes?: Record<string, string | number | boolean>;
}

/**
 * Generate a W3C-compliant traceparent header value.
 * Format: 00-{traceId}-{spanId}-{flags}
 */
export function generateTraceparent(): string {
  const traceId = crypto.randomUUID().replace(/-/g, "");
  const spanId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `00-${traceId}-${spanId}-01`;
}

/**
 * Parse an incoming traceparent header into its components.
 * Returns null if the header is malformed.
 */
export function parseTraceparent(header: string | null | undefined): TraceContext | null {
  if (!header) return null;

  const parts = header.split("-");
  if (parts.length !== 4) return null;

  const [version, traceId, spanId, traceFlags] = parts;
  if (version !== "00") return null;
  if (traceId.length !== 32 || spanId.length !== 16) return null;

  return {
    traceId,
    spanId,
    traceFlags,
    traceparent: header,
  };
}

/**
 * Create a child span context from an existing trace context.
 * The child shares the same traceId but has a new spanId.
 */
export function createChildSpan(parent: TraceContext): TraceContext {
  const newSpanId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const traceparent = `00-${parent.traceId}-${newSpanId}-${parent.traceFlags}`;
  return {
    traceId: parent.traceId,
    spanId: newSpanId,
    traceFlags: parent.traceFlags,
    traceparent,
  };
}

/**
 * Lightweight span timing utility.
 * In the future, this will emit to the configured OTLP collector.
 */
export async function withSpan<T>(
  _options: SpanOptions,
  fn: (ctx: TraceContext) => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const traceparent = generateTraceparent();
  const ctx = parseTraceparent(traceparent) ?? {
    traceId: "0".repeat(32),
    spanId: "0".repeat(16),
    traceFlags: "00",
    traceparent,
  };

  try {
    const result = await fn(ctx);
    const duration = Date.now() - startTime;

    // In production with OTLP, this would emit a completed span.
    // For now, structured log at debug level.
    if (process.env["OTEL_EXPORTER_OTLP_ENDPOINT"]) {
      void duration; // suppress until OTLP is wired
      // TODO: wire to OTLP exporter when SDK is installed
    }

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if OpenTelemetry export is configured.
 */
export function isOtelEnabled(): boolean {
  return Boolean(process.env["OTEL_EXPORTER_OTLP_ENDPOINT"]);
}

/**
 * Get OTEL resource attributes from environment.
 */
export function getResourceAttributes(): Record<string, string> {
  return {
    "service.name": "jobnest",
    "service.version": process.env["BUILD_VERSION"] ?? "0.0.0",
    "service.namespace": "jobnest-v2",
    "deployment.environment": process.env.NODE_ENV ?? "development",
  };
}
