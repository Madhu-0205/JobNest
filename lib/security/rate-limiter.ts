import { logger } from "@/lib/observability/logger";

export interface RateLimiter {
  /**
   * Evaluates if a specific key has exceeded request limits.
   */
  isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean>;
}

/**
 * Memory-backed Rate Limiter.
 * Safe for local development and single-instance container runs.
 * Easily swapped with a Redis-backed rate limiter in multi-node deployments.
 */
export class MemoryRateLimiter implements RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();

  async isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return false;
    }

    entry.count += 1;

    if (entry.count > limit) {
      logger.warn(`Rate limit warning: key [${key}] exceeded boundary limit (${entry.count}/${limit})`);
      return true;
    }

    return false;
  }
}

export const rateLimiter = new MemoryRateLimiter();
