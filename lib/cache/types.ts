/**
 * Cache Provider Interface contract.
 * Decouples caching implementation details from business services.
 */
export interface CacheProvider {
  /**
   * Retrieves a value from the cache.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Sets a value in the cache with an optional TTL (time-to-live) and tagging.
   */
  set<T>(key: string, value: T, ttlSeconds?: number, tags?: string[]): Promise<void>;

  /**
   * Deletes a specific key.
   */
  delete(key: string): Promise<void>;

  /**
   * Clears all cache entries.
   */
  clear(): Promise<void>;

  /**
   * Invalidates cache keys that match any of the provided tags.
   */
  invalidateByTags(tags: string[]): Promise<void>;
}
