import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestStore {
  requestId: string;
  correlationId: string;
  timestamp: number;
  locale?: string;
  timezone?: string;
  clientIp?: string;
  userAgent?: string;
  // Future extensions
  userId?: string;
  organizationId?: string;
  permissions?: string[];
  tenantId?: string;
}

// Storage instance to carry request-scoped metadata
const requestContextStore = new AsyncLocalStorage<RequestStore>();

/**
 * Enterprise Request Context Manager.
 * Uses Node.js AsyncLocalStorage to propagate request-scoped metadata
 * (Correlation ID, Request ID, Locale, Client IP) through the execution stack.
 */
export class RequestContext {
  static getStore(): RequestStore | undefined {
    return requestContextStore.getStore();
  }

  static get requestId(): string | undefined {
    return requestContextStore.getStore()?.requestId;
  }

  static get correlationId(): string | undefined {
    return requestContextStore.getStore()?.correlationId;
  }

  static get clientIp(): string | undefined {
    return requestContextStore.getStore()?.clientIp;
  }

  static get locale(): string | undefined {
    return requestContextStore.getStore()?.locale;
  }

  /**
   * Runs a callback function within the context of a request store.
   */
  static run<T>(store: RequestStore, callback: () => T): T {
    return requestContextStore.run(store, callback);
  }

  /**
   * Sets a dynamic value in the current request store.
   */
  static set(key: keyof RequestStore, value: unknown): void {
    const store = requestContextStore.getStore();
    if (store) {
      (store as unknown as Record<string, unknown>)[key] = value;
    }
  }
}
