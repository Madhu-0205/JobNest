"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense, type ReactNode } from "react";

// ─── Initializer ─────────────────────────────────────────────────────────────

let initialized = false;

function initPostHog() {
  if (initialized) return;
  const key = process.env["NEXT_PUBLIC_POSTHOG_KEY"];
  const host = process.env["NEXT_PUBLIC_POSTHOG_HOST"] ?? "https://app.posthog.com";

  if (!key) return;

  posthog.init(key, {
    api_host: host,
    ui_host: "https://app.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,   // We manually capture page views below
    capture_pageleave: true,
    loaded(ph) {
      // Disable in development to avoid polluting production data
      if (process.env.NODE_ENV === "development") {
        ph.opt_out_capturing();
      }
    },
  });

  initialized = true;
}

// ─── Page View Tracker ────────────────────────────────────────────────────────

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url = searchParams?.size
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * PostHogProvider
 *
 * Wrap the root layout with this provider to enable client-side analytics.
 * Place inside a Suspense boundary (required by useSearchParams).
 *
 * Usage in app/layout.tsx:
 *   <PostHogProvider>
 *     {children}
 *   </PostHogProvider>
 */
export function PostHogProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}

// ─── Re-export hook ───────────────────────────────────────────────────────────

export { usePostHog };
export default posthog;
