import { env } from "@/config/env";

/**
 * Self-contained unit test verification script.
 * Validates that environment configurations initialize correctly on startup.
 */
export function verifyEnvLoading(): boolean {
  if (!env.NEXT_PUBLIC_APP_URL) {
    throw new Error("verifyEnvLoading failed: NEXT_PUBLIC_APP_URL should have a default value");
  }
  
  if (env.NODE_ENV !== "test" && env.NODE_ENV !== "development" && env.NODE_ENV !== "production") {
    throw new Error(`verifyEnvLoading failed: invalid NODE_ENV value: ${env.NODE_ENV}`);
  }
  
  return true;
}
