import { env } from "@/config/env";

/**
 * Enterprise Config Service.
 * Centralizes all application constants, API versions, upload sizes, and security timeouts.
 * Exposes strongly typed getters, eliminating magic numbers in business code.
 */
export class ConfigService {
  /**
   * App Core Configurations
   */
  static get app() {
    return {
      url: env.NEXT_PUBLIC_APP_URL,
      env: env.NODE_ENV,
      version: "2.0.0-alpha.1",
      name: "JobNest",
      apiVersion: "v1",
    };
  }

  /**
   * Security & Rate Limiting Configurations
   */
  static get security() {
    return {
      rateLimitMaxRequests: 100, // Limit each IP to 100 requests per window
      rateLimitWindowMs: 1 * 60 * 1000, // 1 minute
      cookieMaxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
      tokenExpirySeconds: 60 * 15, // 15 minutes (short-lived access tokens)
      jwtSecret: env.NEXTAUTH_SECRET || "local-development-secret-must-be-long-and-secure",
    };
  }

  /**
   * AI / LLM Configurations (Ollama - Later Phase)
   */
  static get ai() {
    return {
      ollamaUrl: env.OLLAMA_API_URL || "http://localhost:11434",
      defaultModel: "llama3",
      temperature: 0.1, // Deterministic matching
      requestTimeoutMs: 15000,
    };
  }

  /**
   * Map & Geolocation Configurations (MapLibre - Later Phase)
   */
  static get maps() {
    return {
      defaultLatitude: 12.9716, // Default center coordinate (Bangalore)
      defaultLongitude: 77.5946,
      defaultZoom: 12,
      maxRadiusMeters: 50000, // Hyperlocal search threshold (50km)
    };
  }

  /**
   * Payment Gateway Configurations (Razorpay - Later Phase)
   */
  static get payments() {
    return {
      razorpayKeyId: env.RAZORPAY_KEY_ID || "mock-key-id",
      razorpayKeySecret: env.RAZORPAY_KEY_SECRET || "mock-key-secret",
      currency: "INR",
      transactionFeePercentage: 2.0, // 2% service charge
    };
  }

  /**
   * Storage & Upload Configurations (Supabase Storage - Later Phase)
   */
  static get storage() {
    return {
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL || "https://mock.supabase.co",
      supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key",
      maxFileSizeBytes: 5 * 1024 * 1024, // 5MB Upload Limit
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
      avatarBucket: "avatars",
      documentBucket: "contracts",
    };
  }

  /**
   * Pagination & Retrieval Limits
   */
  static get pagination() {
    return {
      defaultPageSize: 10,
      maxPageSize: 50,
    };
  }

  /**
   * Cache Configurations
   */
  static get cache() {
    return {
      defaultTtlSeconds: 300, // 5 minutes
      shortTtlSeconds: 60, // 1 minute
      longTtlSeconds: 3600, // 1 hour
    };
  }
}
export type AppConfig = typeof ConfigService.app;
export type SecurityConfig = typeof ConfigService.security;
export type AIConfig = typeof ConfigService.ai;
export type MapsConfig = typeof ConfigService.maps;
export type PaymentsConfig = typeof ConfigService.payments;
export type StorageConfig = typeof ConfigService.storage;
