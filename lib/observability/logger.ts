import { env } from "@/config/env";

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  timestamp: string;
  level: string;
  message: string;
  requestId?: string;
  correlationId?: string;
  clientIp?: string;
  env: string;
  context?: Record<string, unknown>;
}

interface RequestStore {
  requestId: string;
  correlationId: string;
  timestamp: number;
  locale?: string;
  timezone?: string;
  clientIp?: string;
  userAgent?: string;
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

/**
 * Structured Observability Logger.
 * Automatically injects active Request IDs and Correlation IDs into log outputs.
 */
export class ObservabilityLogger {
  private format(level: LogLevel, message: string, context?: Record<string, unknown>): LogPayload {
    const store = getRequestContextStore();
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      requestId: store?.requestId,
      correlationId: store?.correlationId,
      clientIp: store?.clientIp,
      env: env.NODE_ENV,
      context,
    };
  }

  private write(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const payload = this.format(level, message, context);
    const jsonOutput = JSON.stringify(payload);

    if (env.NODE_ENV === "production") {
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
        info: "\x1b[32m",  // Green
        warn: "\x1b[33m",  // Yellow
        error: "\x1b[31m", // Red
      };
      const reset = "\x1b[0m";
      const color = colors[level];
      const reqIdTag = payload.requestId ? ` [ReqID: ${payload.requestId}]` : "";

      if (level === "error") {
        console.error(`[${payload.timestamp}] [${color}${payload.level}${reset}]${reqIdTag} ${payload.message}`, payload.context || "");
      } else if (level === "warn") {
        console.warn(`[${payload.timestamp}] [${color}${payload.level}${reset}]${reqIdTag} ${payload.message}`, payload.context || "");
      } else {
        console.info(`[${payload.timestamp}] [${color}${payload.level}${reset}]${reqIdTag} ${payload.message}`, payload.context || "");
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (env.NODE_ENV !== "production") {
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
    const errorDetails = error instanceof Error ? {
      name: error.name,
      errorMessage: error.message,
      stack: error.stack,
    } : { rawError: error };

    this.write("error", message, { ...context, ...errorDetails });
  }
}

export const logger = new ObservabilityLogger();
