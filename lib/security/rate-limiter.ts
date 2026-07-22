import { logger } from "@/lib/observability/logger";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/security/env-validator";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export type RateLimitType = 
  | "login" 
  | "signup" 
  | "passwordReset" 
  | "emailVerification" 
  | "aiGeneration" 
  | "aiEmbeddings" 
  | "search" 
  | "jobApply" 
  | "createOpportunity" 
  | "bookingCreation" 
  | "paymentCreation" 
  | "admin";

/**
 * Memory-backed fallback when Redis is not configured.
 */
class MemoryRateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>();

  async limit(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return { success: true, limit: maxRequests, remaining: maxRequests - 1, reset: now + windowMs };
    }

    entry.count += 1;
    const success = entry.count <= maxRequests;
    
    if (!success) {
      logger.warn(`Rate limit warning (Memory): key [${key}] exceeded boundary limit (${entry.count}/${maxRequests})`);
    }

    return { 
      success, 
      limit: maxRequests, 
      remaining: Math.max(0, maxRequests - entry.count), 
      reset: entry.resetTime 
    };
  }
}

/**
 * Central Rate Limiter Service.
 */
export class RateLimiterService {
  private redis: Redis | null = null;
  private memoryFallback = new MemoryRateLimiter();
  private limiters: Map<RateLimitType, Ratelimit> = new Map();

  constructor() {
    if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      });
      this.initializeUpstashLimiters();
    }
  }

  private initializeUpstashLimiters() {
    if (!this.redis) return;
    
    // Login: 5 requests / 15 minutes
    this.limiters.set("login", new Ratelimit({ redis: this.redis, limiter: Ratelimit.slidingWindow(5, "15 m"), analytics: true }));
    // Signup: 3 requests / hour
    this.limiters.set("signup", new Ratelimit({ redis: this.redis, limiter: Ratelimit.slidingWindow(3, "1 h"), analytics: true }));
    // Password Reset: 3 requests / hour
    this.limiters.set("passwordReset", new Ratelimit({ redis: this.redis, limiter: Ratelimit.slidingWindow(3, "1 h"), analytics: true }));
    // Email Verification Resend: 5 requests / hour
    this.limiters.set("emailVerification", new Ratelimit({ redis: this.redis, limiter: Ratelimit.slidingWindow(5, "1 h"), analytics: true }));
    // AI Generation: 20 requests / hour
    this.limiters.set("aiGeneration", new Ratelimit({ redis: this.redis, limiter: Ratelimit.slidingWindow(20, "1 h"), analytics: true }));
    // AI Embeddings: 60 requests / hour
    this.limiters.set("aiEmbeddings", new Ratelimit({ redis: this.redis, limiter: Ratelimit.slidingWindow(60, "1 h"), analytics: true }));
    // Search: 120 requests / minute
    this.limiters.set("search", new Ratelimit({ redis: this.redis, limiter: Ratelimit.slidingWindow(120, "1 m"), analytics: true }));
    // Job Apply: 30 requests / hour
    this.limiters.set("jobApply", new Ratelimit({ redis: this.redis, limiter: Ratelimit.slidingWindow(30, "1 h"), analytics: true }));
    // Create Opportunity: 20 requests / hour
    this.limiters.set("createOpportunity", new Ratelimit({ redis: this.redis, limiter: Ratelimit.slidingWindow(20, "1 h"), analytics: true }));
    // Booking Creation: 20 requests / hour
    this.limiters.set("bookingCreation", new Ratelimit({ redis: this.redis, limiter: Ratelimit.slidingWindow(20, "1 h"), analytics: true }));
    // Payment Creation: 10 requests / hour
    this.limiters.set("paymentCreation", new Ratelimit({ redis: this.redis, limiter: Ratelimit.slidingWindow(10, "1 h"), analytics: true }));
    // Admin APIs: 60 requests / minute
    this.limiters.set("admin", new Ratelimit({ redis: this.redis, limiter: Ratelimit.slidingWindow(60, "1 m"), analytics: true }));
  }

  /**
   * Checks the rate limit for a specific type and identifier.
   */
  async check(type: RateLimitType, identifier: string): Promise<RateLimitResult> {
    const limiter = this.limiters.get(type);

    if (limiter) {
      const { success, limit, remaining, reset } = await limiter.limit(identifier);
      if (!success) {
        logger.warn(`Rate limit warning: [${type}] exceeded for identifier [${identifier}]`);
      }
      return { success, limit, remaining, reset };
    }

    // Fallback logic for memory if Redis is not configured
    let fallbackLimit = 100;
    let fallbackWindow = 60000;

    switch (type) {
      case "login": fallbackLimit = 5; fallbackWindow = 15 * 60 * 1000; break;
      case "signup": fallbackLimit = 3; fallbackWindow = 60 * 60 * 1000; break;
      case "search": fallbackLimit = 120; fallbackWindow = 60 * 1000; break;
      case "admin": fallbackLimit = 60; fallbackWindow = 60 * 1000; break;
      case "aiGeneration": fallbackLimit = 20; fallbackWindow = 60 * 60 * 1000; break;
      case "jobApply": fallbackLimit = 30; fallbackWindow = 60 * 60 * 1000; break;
      case "paymentCreation": fallbackLimit = 10; fallbackWindow = 60 * 60 * 1000; break;
      // other fallbacks use defaults
    }

    return this.memoryFallback.limit(`${type}:${identifier}`, fallbackLimit, fallbackWindow);
  }
}

export const rateLimiter = new RateLimiterService();
