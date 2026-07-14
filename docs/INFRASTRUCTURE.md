# JobNest V2 Infrastructure Guide

This guide details the **enterprise infrastructure layers** established in Phase 1.5. These services form the system-level backbone of JobNest, ensuring high observability, resilience, loose coupling, and security.

---

## 1. Request Lifecycle & Context Propagation

Every incoming HTTP request undergoes a standardized lifecycle to ensure security, traceability, and localized context:

```
[Client Request]
       │
       ▼
[middleware.ts]  ───► Generates Correlation ID (UUID) & Request ID (UUID)
       │         ───► Sets W3C traceparent context header
       ▼
[Server Action / API]
       │
       ▼
[runWithRequestContext] ───► Bootstraps AsyncLocalStorage container
       │
  (Inside context)
       ├─► [logger] ───────► Structured logs bind trace IDs automatically
       ├─► [HttpClient] ───► Outbound fetch requests append correlation headers
       └─► [Services] ─────► Evaluates Tenant, Locale, and Client IP
```

*   **Middleware ([middleware.ts](file:///Users/madhu/Desktop/JobNest-dev/middleware.ts))**: Automatically intercepts all page and API requests. Checks for `x-correlation-id` and generates a new one if missing. Creates a unique request-specific execution span ID.
*   **Request Context ([lib/observability/request-context.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/observability/request-context.ts))**: Uses Node's `AsyncLocalStorage` to store the request state context.
*   **Scope Bootstrapper ([lib/observability/request-context-helper.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/observability/request-context-helper.ts))**: Wraps Server Actions and API route logic using `runWithRequestContext(...)` to spin up the async context contextually on headers detection.

---

## 2. Observability & Tracing

Our observability strategy aligns with modern instrumentation formats (e.g. OpenTelemetry):

*   **Correlation & Trace IDs**: Binds related actions across microservices.
*   **Structured JSON Logging ([lib/observability/logger.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/observability/logger.ts))**: 
    *   In **production**, outputs flat, single-line JSON records containing timestamp, level, message, env, clientIp, and active request context identifiers. This allows easy indexing by Logstash, Fluentd, Datadog, or Grafana.
    *   In **development**, formats logs with readability and colors.
*   **Performance Metrics ([lib/observability/performance.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/observability/performance.ts))**: Features `PerformanceTracker` timers to track slow database operations, rendering pipelines, or remote APIs.
*   **Standard Probes**:
    *   `/api/liveness`: Checks that the Node process is running.
    *   `/api/readiness`: Assesses database configurations and third-party adapter reachability.

---

## 3. Feature Flags System

We never hardcode feature flag parameters. All toggle states are routed through the feature flags module.

*   **Config mapping ([lib/feature-flags/config.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/feature-flags/config.ts))**: Defines default boolean parameters and loads flags from environment variables (e.g., `NEXT_PUBLIC_ENABLE_AI`, `NEXT_PUBLIC_ENABLE_CHAT`).
*   **Client Context Provider ([lib/feature-flags/provider.tsx](file:///Users/madhu/Desktop/JobNest-dev/lib/feature-flags/provider.tsx))**: Exposes the `useFeatureFlags` hook to enable or disable client-side components dynamically.
*   **Server Evaluator ([lib/feature-flags/server.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/feature-flags/server.ts))**: Exposes `ServerFeatureFlags.isEnabled(...)` for API handlers and server components.

---

## 4. Decoupled Services & Abstractions

To achieve high testability and clean architecture, our modules interact solely with abstractions:

### HTTP Client ([lib/http/client.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/http/client.ts))
Exposes GET, POST, PUT, PATCH, and DELETE operations. Built on native fetch, this client implements:
1.  **Exponential Backoff Retries**: Automatically retries 5xx server errors, sleeping between attempts.
2.  **Request Timeouts**: Employs `AbortController` cancellation to prevent open socket hang-ups.
3.  **W3C Trace Headers**: Injects traceparent correlation ids automatically.

### Cache Provider ([lib/cache/types.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/cache/types.ts))
Defines generic signatures for caching operations (`get`, `set`, `delete`, `clear`, `invalidateByTags`).
*   **Memory Provider ([lib/cache/memory.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/cache/memory.ts))**: Default thread-safe Map structure with TTL expiry checks.
*   **Scale Plan**: Decoupled interface enables drop-in Redis adapter additions in Phase 2 without changing service methods.

---

## 5. Domain Core Primitives

All business models reside in the pure domain layer under [lib/domain/](file:///Users/madhu/Desktop/JobNest-dev/lib/domain/).

*   **Entity ([lib/domain/base.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/domain/base.ts))**: Domain models possessing unique keys (e.g., `Job`, `User`). Identity equality is based on unique IDs.
*   **ValueObject ([lib/domain/base.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/domain/base.ts))**: Structural objects defined by properties alone (e.g., `GeoLocation`, `Amount`). Immutable.
*   **AggregateRoot ([lib/domain/aggregate.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/domain/aggregate.ts))**: Boundary entities that emit transactional domain events.
*   **Repository Contract ([lib/domain/repository.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/domain/repository.ts))**: Generic repository layouts. Formats standard pagination parameters and sorting filters.
*   **Result Monad ([lib/api/result.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/api/result.ts))**: Wraps operations in type-safe success or failure structures, preventing unhandled exceptions.
