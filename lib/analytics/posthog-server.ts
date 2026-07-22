/**
 * PostHog Server-Side Analytics
 *
 * Uses posthog-node for server-side event tracking.
 * Client is lazily instantiated — safe to import without NEXT_PUBLIC_POSTHOG_KEY set.
 *
 * Usage:
 *   import { posthog } from '@/lib/analytics/posthog-server';
 *   await posthog.capture({ distinctId: userId, event: 'payment_success', properties: { amount } });
 *
 * Canonical events:
 *   user_signup         — new user account created
 *   login               — successful authentication
 *   job_posted          — employer posted a new job listing
 *   application_submitted — worker submitted an application
 *   worker_hired        — employer hired a worker
 *   booking_created     — a booking/appointment was confirmed
 *   payment_success     — Razorpay payment captured
 *   payment_failure     — Razorpay payment.failed event received
 *   dispute_opened      — dispute raised by either party
 */

import { PostHog } from "posthog-node";

// ─── Singleton ────────────────────────────────────────────────────────────────

let _client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env["NEXT_PUBLIC_POSTHOG_KEY"];
  const host = process.env["NEXT_PUBLIC_POSTHOG_HOST"] ?? "https://app.posthog.com";

  if (!key) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[PostHog] NEXT_PUBLIC_POSTHOG_KEY is not set. Product analytics are DISABLED.");
    }
    return null;
  }

  if (!_client) {
    _client = new PostHog(key, {
      host,
      // Flush immediately on serverless (no long-lived process to batch)
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return _client;
}

// ─── Event Tracker ───────────────────────────────────────────────────────────

export type PostHogEvent =
  | "user_signup"
  | "login"
  | "job_posted"
  | "application_submitted"
  | "worker_hired"
  | "booking_created"
  | "payment_success"
  | "payment_failure"
  | "dispute_opened";

/**
 * Track a server-side analytics event.
 * Silently no-ops if NEXT_PUBLIC_POSTHOG_KEY is not set.
 */
export async function trackEvent(
  event: PostHogEvent,
  distinctId: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        $lib: "posthog-node",
        environment: process.env.NODE_ENV,
      },
    });
    await client.flush();
  } catch {
    // Analytics must never crash the main request path
    console.warn(`[PostHog] Failed to track event '${event}' for user '${distinctId}'`);
  }
}

/**
 * Identify a user with traits (called after signup/login).
 */
export async function identifyUser(
  distinctId: string,
  properties: {
    email?: string;
    name?: string;
    role?: string;
    createdAt?: string;
    [key: string]: unknown;
  }
): Promise<void> {
  const client = getClient();
  if (!client) return;

  try {
    client.identify({ distinctId, properties });
    await client.flush();
  } catch {
    console.warn(`[PostHog] Failed to identify user '${distinctId}'`);
  }
}

/** Gracefully shuts down the PostHog client (useful in tests). */
export async function shutdownPostHog(): Promise<void> {
  if (_client) {
    await _client.shutdown();
    _client = null;
  }
}
