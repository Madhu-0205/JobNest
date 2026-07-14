import { defaultFeatureFlags } from "./config";
import { FeatureFlagKey } from "./types";

/**
 * Enterprise Server Feature Flag Evaluator.
 * Used inside Next.js Server Components, Server Actions, and API route handlers.
 * Prepared for database-backed runtime overrides.
 */
export class ServerFeatureFlags {
  /**
   * Checks whether a feature flag is active on the server.
   */
  static isEnabled(key: FeatureFlagKey): boolean {
    // Standard environment configuration lookup
    const isConfigured = defaultFeatureFlags[key];

    // Placeholder check for runtime user overrides/headers (e.g. A/B testing)
    // const cookieOverride = cookies().get(`ff_${key}`);
    // if (cookieOverride) return cookieOverride.value === 'true';

    return !!isConfigured;
  }
}
