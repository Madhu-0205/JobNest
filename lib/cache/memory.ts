import { CacheProvider } from "./types";

interface CacheEntry<T> {
  value: T;
  expiry: number | null;
  tags?: string[];
}

/**
 * Memory Cache Provider implementation.
 * Safe for development and simple single-instance node environments.
 */
export class MemoryCacheProvider implements CacheProvider {
  private cache = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (entry.expiry && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number, tags?: string[]): Promise<void> {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.cache.set(key, { value, expiry, tags });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    const tagSet = new Set(tags);
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.some((tag) => tagSet.has(tag))) {
        this.cache.delete(key);
      }
    }
  }
}
