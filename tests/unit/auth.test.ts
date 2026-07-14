import { signUpSchema, loginSchema } from "@/features/auth/schemas";
import { parseUserAgent } from "@/features/auth/sessions";
import { rateLimiter } from "@/lib/security/rate-limiter";

/**
 * Unit Test: Sign Up input validation schema behavior.
 */
export function verifySignUpValidation(): boolean {
  const validPayload = {
    email: "candidate@jobnest.io",
    password: "SecurePass123!",
    displayName: "Alex Mercer",
    username: "alex_mercer",
    role: "worker" as const,
  };

  const checkValid = signUpSchema.safeParse(validPayload);
  if (!checkValid.success) {
    throw new Error(`Validation failed for valid signup payload: ${JSON.stringify(checkValid.error.flatten())}`);
  }

  // Check weak password (missing special char, numbers, and uppercase)
  const weakPayload = { ...validPayload, password: "weak" };
  const checkWeak = signUpSchema.safeParse(weakPayload);
  if (checkWeak.success) {
    throw new Error("Security breach: Weak password was incorrectly accepted.");
  }

  // Check invalid username chars
  const badUsernamePayload = { ...validPayload, username: "alex-mercer!" };
  const checkBadUsername = signUpSchema.safeParse(badUsernamePayload);
  if (checkBadUsername.success) {
    throw new Error("Validation breach: Invalid username characters accepted.");
  }

  return true;
}

/**
 * Unit Test: Login validation logic.
 */
export function verifyLoginValidation(): boolean {
  const invalidEmailPayload = {
    email: "not-an-email",
    password: "SomePassword!",
  };

  const checkInvalidEmail = loginSchema.safeParse(invalidEmailPayload);
  if (checkInvalidEmail.success) {
    throw new Error("Validation failure: Allowed malformed email input.");
  }

  return true;
}

/**
 * Unit Test: Custom user agent string parsing.
 */
export function verifyUserAgentParsing(): boolean {
  const macChromeUa = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const parsedMac = parseUserAgent(macChromeUa);

  if (parsedMac.os !== "macOS" || parsedMac.browser !== "Chrome" || parsedMac.deviceType !== "desktop") {
    throw new Error(`UserAgent mismatch for macOS/Chrome: Got ${JSON.stringify(parsedMac)}`);
  }

  const iphoneSafariUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";
  const parsedIphone = parseUserAgent(iphoneSafariUa);

  if (parsedIphone.os !== "iOS" || parsedIphone.browser !== "Safari" || parsedIphone.deviceType !== "mobile") {
    throw new Error(`UserAgent mismatch for iPhone/Safari: Got ${JSON.stringify(parsedIphone)}`);
  }

  return true;
}

/**
 * Unit Test: Memory rate limiting rules.
 */
export async function verifyRateLimiting(): Promise<boolean> {
  const testKey = "brute-force-test-key";
  const limitCount = 2;
  const resetWindow = 2000; // 2s

  const call1 = await rateLimiter.isRateLimited(testKey, limitCount, resetWindow);
  const call2 = await rateLimiter.isRateLimited(testKey, limitCount, resetWindow);
  
  if (call1 || call2) {
    throw new Error("Rate limiter triggered prematurely before boundary count.");
  }

  const call3 = await rateLimiter.isRateLimited(testKey, limitCount, resetWindow);
  if (!call3) {
    throw new Error("Rate limiter failed to block requests exceeding configured count.");
  }

  return true;
}
