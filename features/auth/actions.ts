"use server";

import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  loginSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateEmailSchema,
  updateProfileSchema
} from "./schemas";
import { z } from "zod";
import { headers } from "next/headers";
import { runWithRequestContext } from "@/lib/observability/request-context-helper";
import { logRequestLifecycle } from "@/lib/observability/request-logger";
import { rateLimiter } from "@/lib/security/rate-limiter";
import { logger } from "@/lib/observability/logger";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

/**
 * Executes a function and formats the output into a serializable ActionResult.
 */
async function executeAction<T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  return runWithRequestContext(async () => {
    return logRequestLifecycle(actionName, async (): Promise<ActionResult<T>> => {
      try {
        const data = await fn();
        return { success: true, data };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const details = error.flatten().fieldErrors;
          logger.warn(`[DEBUG] Validation failed for ${actionName}`, { details });
          return {
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: "Input validation failed.",
              details,
            },
          };
        }
        const safeErrorMsg = error instanceof Error ? error.message : "An unexpected failure occurred.";
        const errRec = error as Record<string, unknown>;
        const safeErrorCode = errRec['code'] || (error instanceof Error ? error.name : "UNKNOWN_ERROR");
        const safeErrorStatus = errRec['status'] || 500;
        logger.error(`[DEBUG] Server Action ${actionName} failed`, { code: safeErrorCode, message: safeErrorMsg, status: safeErrorStatus });

        return {
          success: false,
          error: {
            code: safeErrorCode as string,
            message: safeErrorMsg,
          },
        };
      }
    });
  });
}

/**
 * Server Action: Registers a new user.
 */
export async function signUpAction(formData: unknown): Promise<ActionResult<{ userId: string; requiresEmailConfirmation: boolean }>> {
  return executeAction("signUpAction", async () => {
    logger.info("[DEBUG] signUpAction started");
    const ip = (await headers()).get("x-forwarded-for") || "unknown-ip";
    
    logger.info("[DEBUG] Checking rate limiter for signup");
    const { success: rateLimitSuccess } = await rateLimiter.check("signup", ip);
    if (!rateLimitSuccess) {
      logger.warn("[DEBUG] Rate limit exceeded for signup");
      throw new Error("RATE_LIMIT");
    }

    logger.info("[DEBUG] Validating signup schema");
    const validated = signUpSchema.parse(formData);
    
    logger.info("[DEBUG] Initializing Supabase server client");
    const supabase = await createServerClient();

    logger.info("[DEBUG] Calling supabase.auth.signUp");
    const { data, error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        emailRedirectTo: `${process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"}/auth/callback`,
        data: {
          display_name: validated.displayName,
          username: validated.username,
          role: validated.role,
        },
      },
    });

    if (error) {
      const errRecord = error as unknown as Record<string, unknown>;
      logger.error("[DEBUG] supabase.auth.signUp failed", {
        message: error.message,
        code: errRecord['code'],
        status: errRecord['status'],
        name: error.name,
        type: errRecord['type'],
        causeCode: (errRecord['cause'] as Record<string, unknown>)?.['code']
      });
      if (error.message.includes("already registered") || (error as unknown as { status?: number }).status === 422) {
        throw new Error("DUPLICATE_ACCOUNT");
      }
      if (error.message.includes("fetch failed") || (errRecord as unknown as { code?: string }).code === "ENOTFOUND" || (errRecord as unknown as { code?: string }).code === "ECONNREFUSED" || error.message.includes("Failed to fetch")) {
        throw new Error("NETWORK_FAILURE");
      }
      throw new Error("SERVER_FAILURE");
    }

    logger.info("[DEBUG] supabase.auth.signUp succeeded");

    if (!data.user) {
      logger.warn("[DEBUG] Sign up completed but user profile was not returned.");
      throw new Error("Sign up completed but user profile was not returned.");
    }

    // Check if email confirmation is required (session will be null)
    const requiresEmailConfirmation = !data.session && data.user?.identities && data.user.identities.length > 0;
    if (requiresEmailConfirmation) {
      logger.info("[DEBUG] Email confirmation is required");
    }

    return { userId: data.user.id, requiresEmailConfirmation: !!requiresEmailConfirmation };
  });
}

/**
 * Server Action: Authenticates a user credentials.
 */
export async function signInAction(formData: unknown): Promise<ActionResult<{ userId: string }>> {
  return executeAction("signInAction", async () => {
    const ip = (await headers()).get("x-forwarded-for") || "unknown-ip";
    const { success } = await rateLimiter.check("login", ip);
    if (!success) throw new Error("Too Many Requests");

    const validated = loginSchema.parse(formData);

    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });
    
    if (error) {
      // Throw the REAL Supabase error instead of a generic one
      throw new Error(`Supabase Auth Error: ${error.message} (Code: ${error.code})`);
    }

    if (!data.user) {
      throw new Error("Authentication failed: User details empty.");
    }

    return { userId: data.user.id };
  });
}

/**
 * Server Action: Terminates the active session.
 */
export async function signOutAction(): Promise<ActionResult<void>> {
  return executeAction("signOutAction", async () => {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Requests a password reset link email.
 */
export async function forgotPasswordAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("forgotPasswordAction", async () => {
    const ip = (await headers()).get("x-forwarded-for") || "unknown-ip";
    const { success } = await rateLimiter.check("passwordReset", ip);
    if (!success) throw new Error("Too Many Requests");

    const validated = forgotPasswordSchema.parse(formData);
    const supabase = await createServerClient();

    const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
      redirectTo: `${process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"}/auth/reset-password`,
    });

    if (error) {
      logger.warn(`Password reset ignored to prevent enumeration: ${error.message}`);
    }
    // Always succeed generically
  });
}

/**
 * Server Action: Updates the password for the current session.
 */
export async function updatePasswordAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("updatePasswordAction", async () => {
    const validated = resetPasswordSchema.parse(formData);
    const supabase = await createServerClient();

    const { error } = await supabase.auth.updateUser({
      password: validated.password,
    });

    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Triggers an email change request.
 */
export async function updateEmailAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("updateEmailAction", async () => {
    const validated = updateEmailSchema.parse(formData);
    const supabase = await createServerClient();

    const { error } = await supabase.auth.updateUser({
      email: validated.email,
    });

    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Updates the current user's profile details.
 */
export async function updateProfileAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("updateProfileAction", async () => {
    const validated = updateProfileSchema.parse(formData);
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: validated.displayName,
        avatar_url: validated.avatarUrl,
        phone: validated.phone,
        locale: validated.locale,
        timezone: validated.timezone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Permanently deletes the user account using high-privilege admin SDK.
 */
export async function deleteAccountAction(): Promise<ActionResult<void>> {
  return executeAction("deleteAccountAction", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const adminClient = createAdminClient();
    const { error } = await adminClient.auth.admin.deleteUser(user.id);
    
    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Exports all personal user data (GDPR Article 20 Data Portability).
 */
export async function exportUserDataAction(): Promise<ActionResult<{ user: unknown; profile: unknown }>> {
  return executeAction("exportUserDataAction", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      },
      profile: profile ?? null,
    };
  });
}
