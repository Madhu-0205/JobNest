/**
 * Feature flag keys definition schema.
 */
export interface FeatureFlags {
  ENABLE_AI: boolean;
  ENABLE_CHAT: boolean;
  ENABLE_PAYMENTS: boolean;
  ENABLE_TRACKING: boolean;
  ENABLE_NOTIFICATIONS: boolean;
  ENABLE_ADMIN: boolean;
}

export type FeatureFlagKey = keyof FeatureFlags;

export interface FeatureFlagValue {
  enabled: boolean;
  rolloutPercentage?: number; // Decoupled support for dynamic rollouts
  ruleOverrides?: Record<string, boolean>;
}
