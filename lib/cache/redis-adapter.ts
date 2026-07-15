/**
 * Redis cache adapter.
 *
 * Provides a unified caching interface that works in three modes:
 *   1. Redis (production) — via Upstash-compatible HTTP REST API (no native module needed)
 *   2. In-memory LRU (development / test) — zero-dependency fallback
 *   3. No-op (explicitly disabled)
 *
 * Drop-in compatible with the `CacheProvider` interface in `lib/cache/types.ts`.
 */

import type { CacheProvider } from "./types";

// ─── In-memory LRU ────────────────────────────────────────────────────────────

interface LruEntry {
  value: unknown;
  expiresAt: number | null;
}

class LruCache implements CacheProvider {
  private readonly store = new Map<string, LruEntry>();
  private readonly maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // LRU refresh: move to end
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number, _tags?: string[]): Promise<void> {
    if (this.store.size >= this.maxSize) {
      // Evict oldest entry
      const oldest = this.store.keys().next().value;
      if (oldest) this.store.delete(oldest);
    }
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async invalidateByTags(_tags: string[]): Promise<void> {
    // Tag-based invalidation not implemented in memory mode
    // Future: maintain a tag→key index and delete accordingly
  }

  /** Expose size for observability */
  get size(): number {
    return this.store.size;
  }
}

// ─── Upstash / Redis REST adapter ────────────────────────────────────────────

class RedisRestAdapter implements CacheProvider {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
  }

  private async exec<T>(args: (string | number)[]): Promise<T> {
    const res = await fetch(
      `${this.baseUrl}/${args.map(encodeURIComponent).join("/")}`,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    if (!res.ok) throw new Error(`Redis REST error: ${res.status}`);
    const json = (await res.json()) as { result: T };
    return json.result;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.exec<string | null>(["GET", key]);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number, _tags?: string[]): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.exec(["SET", key, serialized, "EX", ttlSeconds]);
    } else {
      await this.exec(["SET", key, serialized]);
    }
  }

  async delete(key: string): Promise<void> {
    await this.exec(["DEL", key]);
  }

  async clear(): Promise<void> {
    // FLUSHDB — only safe in scoped test databases; disabled in production
    if (process.env.NODE_ENV !== "production") {
      await this.exec(["FLUSHDB"]);
    }
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    // Requires a tag→keys secondary index; use Redis SET (SMEMBERS + DEL pattern)
    for (const tag of tags) {
      const keys = await this.exec<string[]>(["SMEMBERS", `tag:${tag}`]);
      for (const k of keys) {
        await this.exec(["DEL", k]);
      }
      await this.exec(["DEL", `tag:${tag}`]);
    }
  }
}

// ─── No-op adapter ────────────────────────────────────────────────────────────

class NoopAdapter implements CacheProvider {
  async get<T>(_key: string): Promise<T | null> { return null; }
  async set<T>(_key: string, _value: T, _ttl?: number, _tags?: string[]): Promise<void> { }
  async delete(_key: string): Promise<void> { }
  async clear(): Promise<void> { }
  async invalidateByTags(_tags: string[]): Promise<void> { }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export type AdapterMode = "redis" | "memory" | "noop";

export interface RedisAdapterOptions {
  mode?: AdapterMode;
  /** Upstash Redis REST URL (falls back to UPSTASH_REDIS_REST_URL env var) */
  redisUrl?: string;
  /** Upstash Redis REST token (falls back to UPSTASH_REDIS_REST_TOKEN env var) */
  redisToken?: string;
  /** Max entries for in-memory LRU (default: 1000) */
  maxMemoryEntries?: number;
}

/**
 * Create a cache adapter.
 *
 * Mode resolution (auto when `mode` is omitted):
 *   - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars present → redis
 *   - else → memory
 */
export function createCacheAdapter(options: RedisAdapterOptions = {}): CacheProvider {
  const redisUrl = options.redisUrl ?? process.env["UPSTASH_REDIS_REST_URL"];
  const redisToken = options.redisToken ?? process.env["UPSTASH_REDIS_REST_TOKEN"];

  const mode: AdapterMode =
    options.mode ?? (redisUrl && redisToken ? "redis" : "memory");

  switch (mode) {
    case "redis":
      if (!redisUrl || !redisToken) {
        console.warn("[cache] Redis mode requested but credentials missing — falling back to memory");
        return new LruCache(options.maxMemoryEntries);
      }
      return new RedisRestAdapter(redisUrl, redisToken);

    case "noop":
      return new NoopAdapter();

    case "memory":
    default:
      return new LruCache(options.maxMemoryEntries);
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

/** Platform-wide default cache instance (auto-configured from env) */
export const cache: CacheProvider = createCacheAdapter();

export { LruCache, RedisRestAdapter, NoopAdapter };
