

export type LogLevel = "debug" | "info" | "warn" | "error";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogPayload {
  timestamp: string;
  level: string;
  message: string;
  // Request context — automatically injected when inside a request lifecycle
  request_id?: string;
  correlation_id?: string;
  user_id?: string;
  client_ip?: string;
  // Optional structured fields
  route?: string;
  method?: string;
  status?: number;
  duration_ms?: number;
  env: string;
  context?: Record<string, unknown>;
}

/** Shape of the HTTP request log entry (subset of LogPayload). */
export interface RequestLogEntry {
  request_id: string;
  correlation_id: string;
  user_id?: string;
  route: string;
  method: string;
  status: number;
  duration_ms: number;
}

interface RequestStore {
  requestId: string;
  correlationId: string;
  timestamp: number;
  locale?: string;
  timezone?: string;
  clientIp?: string;
  userAgent?: string;
  userId?: string;
}

interface RequestContextModule {
  RequestContext: {
    getStore: () => RequestStore | undefined;
  };
}

// Safely resolve the store only on the server, avoiding client-side bundling of node:async_hooks
const getRequestContextStore = (): RequestStore | undefined => {
  if (typeof window === "undefined") {
    try {
      const req = (globalThis as unknown as { require: (id: string) => RequestContextModule }).require;
      return req("./request-context").RequestContext.getStore();
    } catch {
      return undefined;
    }
  }
  return undefined;
};

// ─── Scrubbing ────────────────────────────────────────────────────────────────

const SENSITIVE_KEYS = new Set([
  "password", "token", "secret", "key", "jwt", "authorization", 
  "credit_card", "cvv", "api_key"
]);

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  for (const s of SENSITIVE_KEYS) {
    if (lower.includes(s)) return true;
  }
  return false;
}

function scrubContext(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => scrubContext(item));
  }

  const scrubbed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      scrubbed[key] = "[REDACTED]";
    } else {
      scrubbed[key] = scrubContext(value);
    }
  }
  return scrubbed;
}

// ─── Logger ───────────────────────────────────────────────────────────────────

/**
 * Structured Observability Logger.
 *
 * In production: emits newline-delimited JSON (stdout/stderr).
 * In development: colorised human-readable output with the same fields.
 *
 * Automatically injects request_id, correlation_id, and user_id from the
 * active AsyncLocalStorage RequestContext.
 */
export class ObservabilityLogger {
  private format(level: LogLevel, message: string, context?: Record<string, unknown>): LogPayload {
    const store = getRequestContextStore();
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      request_id: store?.requestId,
      correlation_id: store?.correlationId,
      user_id: store?.userId,
      client_ip: store?.clientIp,
      env: process.env.NODE_ENV || "development",
      context: context ? scrubContext(context) as Record<string, unknown> : undefined,
    };
  }

  private write(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const payload = this.format(level, message, context);
    const jsonOutput = JSON.stringify(payload);

    if (process.env.NODE_ENV === "production") {
      if (level === "error") {
        console.error(jsonOutput);
      } else if (level === "warn") {
        console.warn(jsonOutput);
      } else {
        console.info(jsonOutput);
      }
    } else {
      const colors = {
        debug: "\x1b[36m", // Cyan
        info:  "\x1b[32m", // Green
        warn:  "\x1b[33m", // Yellow
        error: "\x1b[31m", // Red
      };
      const reset = "\x1b[0m";
      const color = colors[level];
      const reqIdTag = payload.request_id ? ` [ReqID: ${payload.request_id}]` : "";
      const userTag  = payload.user_id    ? ` [UID: ${payload.user_id}]`      : "";

      if (level === "error") {
        console.error(`[${payload.timestamp}] [${color}${payload.level}${reset}]${reqIdTag}${userTag} ${payload.message}`, payload.context ?? "");
      } else if (level === "warn") {
        console.warn(`[${payload.timestamp}] [${color}${payload.level}${reset}]${reqIdTag}${userTag} ${payload.message}`, payload.context ?? "");
      } else {
        console.info(`[${payload.timestamp}] [${color}${payload.level}${reset}]${reqIdTag}${userTag} ${payload.message}`, payload.context ?? "");
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      this.write("debug", message, context);
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.write("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.write("warn", message, context);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
    const errorDetails =
      error instanceof Error
        ? { name: error.name, errorMessage: error.message, stack: error.stack }
        : { rawError: error };
    this.write("error", message, { ...context, ...errorDetails });
  }

  /**
   * Emit a structured HTTP request completion log.
   * Includes all fields required by the observability spec:
   * request_id, correlation_id, user_id, route, method, status, duration_ms.
   */
  logRequest(entry: RequestLogEntry) {
    const store = getRequestContextStore();
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: `${entry.method} ${entry.route} → ${entry.status} (${entry.duration_ms}ms)`,
      request_id: entry.request_id,
      correlation_id: entry.correlation_id,
      user_id: entry.user_id ?? store?.userId,
      route: entry.route,
      method: entry.method,
      status: entry.status,
      duration_ms: entry.duration_ms,
      env: process.env.NODE_ENV || "development",
    };

    if (process.env.NODE_ENV === "production") {
      console.info(JSON.stringify(payload));
    } else {
      const statusColor = entry.status >= 500 ? "\x1b[31m" : entry.status >= 400 ? "\x1b[33m" : "\x1b[32m";
      const reset = "\x1b[0m";
      console.info(
        `[${payload.timestamp}] [${statusColor}REQ${reset}] ` +
          `[ReqID: ${entry.request_id}] ` +
          `${entry.method} ${entry.route} → ${statusColor}${entry.status}${reset} (${entry.duration_ms}ms)` +
          (entry.user_id ? ` [UID: ${entry.user_id}]` : "")
      );
    }
  }
}

export const logger = new ObservabilityLogger();
