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
import { runWithRequestContext } from "@/lib/observability/request-context-helper";
import { logRequestLifecycle } from "@/lib/observability/request-logger";

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
          return {
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: "Input validation failed.",
              details,
            },
          };
        }
        
        return {
          success: false,
          error: {
            code: error instanceof Error ? error.name : "UNKNOWN_ERROR",
            message: error instanceof Error ? error.message : "An unexpected failure occurred.",
          },
        };
      }
    });
  });
}

/**
 * Server Action: Registers a new user.
 */
export async function signUpAction(formData: unknown): Promise<ActionResult<{ userId: string }>> {
  return executeAction("signUpAction", async () => {
    const validated = signUpSchema.parse(formData);
    const supabase = await createServerClient();

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
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Sign up completed but user profile was not returned.");
    }

    return { userId: data.user.id };
  });
}

/**
 * Server Action: Authenticates a user credentials.
 */
export async function signInAction(formData: unknown): Promise<ActionResult<{ userId: string }>> {
  return executeAction("signInAction", async () => {
    const validated = loginSchema.parse(formData);
    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      throw new Error(error.message);
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
    const validated = forgotPasswordSchema.parse(formData);
    const supabase = await createServerClient();

    const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
      redirectTo: `${process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"}/auth/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }
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
 * Server Action: Permamently deletes the user account using high-privilege admin SDK.
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
