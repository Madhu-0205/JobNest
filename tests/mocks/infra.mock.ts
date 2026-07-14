import { CacheProvider } from "@/lib/cache/types";
import { LogLevel } from "@/lib/observability/logger";
import { FeatureFlags, FeatureFlagKey } from "@/lib/feature-flags/types";
import { RequestStore, RequestContext } from "@/lib/observability/request-context";

/**
 * Mock Logger Service for unit tests.
 * Captures calls in memory to allow assertion testing.
 */
export class MockLogger {
  public logs: { level: LogLevel; message: string; context?: unknown }[] = [];

  info(message: string, context?: Record<string, unknown>): void {
    this.logs.push({ level: "info", message, context });
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logs.push({ level: "warn", message, context });
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    this.logs.push({ level: "error", message, context: { error, ...context } });
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logs.push({ level: "debug", message, context });
  }
}

/**
 * Mock Cache Provider for testing.
 * Implements full CacheProvider interface with in-memory map.
 */
export class MockCache implements CacheProvider {
  private store = new Map<string, { value: unknown; tags?: string[] }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, _ttlSeconds?: number, tags?: string[]): Promise<void> {
    this.store.set(key, { value, tags });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    const tagSet = new Set(tags);
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags && entry.tags.some((tag) => tagSet.has(tag))) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Mock Feature Flag manager.
 * Simplifies mocking feature state during integration test routes.
 */
export class MockFeatureFlags {
  private flags: FeatureFlags;

  constructor(initialFlags: Partial<FeatureFlags> = {}) {
    this.flags = {
      ENABLE_AI: false,
      ENABLE_CHAT: false,
      ENABLE_PAYMENTS: false,
      ENABLE_TRACKING: false,
      ENABLE_NOTIFICATIONS: false,
      ENABLE_ADMIN: false,
      ...initialFlags,
    };
  }

  isEnabled(key: FeatureFlagKey): boolean {
    return this.flags[key];
  }

  setFlag(key: FeatureFlagKey, value: boolean): void {
    this.flags[key] = value;
  }
}

/**
 * Mock HTTP Client response builder.
 */
export const createMockHttpResponse = (data: unknown, status = 200, statusText = "OK"): Response => {
  return new Response(JSON.stringify(data), {
    status,
    statusText,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

/**
 * Request Context Mock Runner.
 * Executes a callback block wrapped inside a mock AsyncLocalStorage session.
 */
export function runInMockContext<T>(callback: () => T, overrides?: Partial<RequestStore>): T {
  const store: RequestStore = {
    requestId: "mock-request-id-123",
    correlationId: "mock-correlation-id-456",
    timestamp: Date.now(),
    locale: "en-US",
    timezone: "UTC",
    clientIp: "127.0.0.1",
    userAgent: "Mozilla/MockBrowser",
    ...overrides,
  };
  return RequestContext.run(store, callback);
}
