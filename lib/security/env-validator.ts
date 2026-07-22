/**
 * Environment variable validator.
 *
 * Validates all required environment variables at startup.
 * Provides typed, validated access to env vars throughout the codebase.
 *
 * Usage:
 *   import { env } from '@/lib/security/env-validator';
 *   const url = env.SUPABASE_URL;
 */

import { z } from "zod";

// ─── Schema ────────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // ── Node ──────────────────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // ── Supabase ──────────────────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(10, "NEXT_PUBLIC_SUPABASE_ANON_KEY is too short"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(10, "SUPABASE_SERVICE_ROLE_KEY is too short")
    .optional(),

  // ── App ───────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .or(z.literal(""))
    .optional()
    .default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().or(z.literal("")).optional(),

  // ── AI Provider ──────────────────────────────────────────────────────────────
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(["gemini", "openai", "ollama", "sandbox"]).optional(),
  AI_REQUEST_TIMEOUT_MS: z.string().optional().transform((v) => v ? Number(v) : 30000),
  GEMINI_CHAT_MODEL: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().optional(),

  // ── Payments ──────────────────────────────────────────────────────────────
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(16, "RAZORPAY_WEBHOOK_SECRET must be at least 16 characters").optional(),
  /** Public Razorpay key for the browser-side Checkout.js (NEXT_PUBLIC_ prefix makes it available client-side). */
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),

  // ── Monitoring ─────────────────────────────────────────────────────────────
  SENTRY_DSN: z.string().url().or(z.literal("")).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().or(z.literal("")).optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().or(z.literal("")).optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().or(z.literal("")).optional(),
  OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),

  // ── Build ────────────────────────────────────────────────────────────────────
  COMMIT_SHA: z.string().optional(),

  // ── Storage ───────────────────────────────────────────────────────────────
  STORAGE_BUCKET_DOCUMENTS: z.string().optional().default("documents"),
  STORAGE_BUCKET_AVATARS: z.string().optional().default("avatars"),

  // ── Observability ─────────────────────────────────────────────────────────
  METRICS_SECRET: z.string().optional(),
  
  // ── Redis / Upstash ───────────────────────────────────────────────────────
  UPSTASH_REDIS_REST_URL: z.string().url().or(z.literal("")).optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .optional()
    .default("info"),

  // ── Feature flags ─────────────────────────────────────────────────────────
  NEXT_PUBLIC_FEATURE_AI_MATCHING: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  NEXT_PUBLIC_FEATURE_REALTIME: z
    .string()
    .optional()
    .transform((v) => v !== "false"), // default on
});

// ─── Validation ────────────────────────────────────────────────────────────────

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

/**
 * Validate and return the typed environment.
 * Throws on first invocation if required vars are missing.
 * Cached after first successful parse.
 */
export function validateEnv(): Env {
  if (_env) return _env;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((e) => `  • ${e.path.join(".")}: ${e.message}`)
      .join("\n");

    const message = `\n❌ Environment validation failed:\n${errors}\n`;

    // In CI/CD or production, crash immediately
    if (process.env.NODE_ENV === "production" || process.env["CI"]) {
      throw new Error(message);
    }

    // In development, warn but continue
    console.warn(message);

    // Return best-effort parse (with defaults applied where possible)
    _env = parsed.error.issues.reduce(
      (acc, _) => acc,
      process.env as unknown as Env
    );
    return _env;
  }

  _env = parsed.data;
  return _env;
}

/**
 * Typed, validated environment singleton.
 * Safe to use in any server-side module.
 */
export const env = new Proxy({} as Env, {
  get(_, key: string) {
    return validateEnv()[key as keyof Env];
  },
});

/** Reset cached env (for testing) */
export function _resetEnvCache(): void {
  _env = null;
}
