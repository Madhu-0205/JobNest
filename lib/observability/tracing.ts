import { RequestContext } from "./request-context";

/**
 * Enterprise Tracing Abstraction.
 * Provides APIs to hook into active spans and trace context propagation.
 * Integrates with standard OpenTelemetry headers (e.g. w3c tracecontext standard) in later phases.
 */
export class Tracing {
  /**
   * Retrieves the current active trace identifier (correlationId).
   */
  static getTraceId(): string | undefined {
    return RequestContext.correlationId;
  }

  /**
   * Retrieves the current span identifier (requestId).
   */
  static getSpanId(): string | undefined {
    return RequestContext.requestId;
  }

  /**
   * Generates W3C Trace Context compatible headers for cross-service API requests.
   */
  static getTraceHeaders(): Record<string, string> {
    const traceId = this.getTraceId();
    const spanId = this.getSpanId();

    if (!traceId || !spanId) return {};

    // 00-traceid-spanid-flags (w3c traceparent standard format)
    return {
      "traceparent": `00-${traceId}-${spanId}-01`,
    };
  }
}
