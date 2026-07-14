import { FeatureFlags } from "./types";

/**
 * Local environment default feature flags configurations.
 * Enforces reading from process.env with default safe fallbacks.
 */
export const defaultFeatureFlags: FeatureFlags = {
  ENABLE_AI: process.env["NEXT_PUBLIC_ENABLE_AI"] === "true",
  ENABLE_CHAT: process.env["NEXT_PUBLIC_ENABLE_CHAT"] === "true",
  ENABLE_PAYMENTS: process.env["NEXT_PUBLIC_ENABLE_PAYMENTS"] === "true",
  ENABLE_TRACKING: process.env["NEXT_PUBLIC_ENABLE_TRACKING"] === "true",
  ENABLE_NOTIFICATIONS: process.env["NEXT_PUBLIC_ENABLE_NOTIFICATIONS"] === "true",
  ENABLE_ADMIN: process.env["NEXT_PUBLIC_ENABLE_ADMIN"] === "true",
};
