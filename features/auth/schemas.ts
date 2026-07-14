import { z } from "zod";

/**
 * Robust Password Strength Validation Schema.
 * Enforces: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special character.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character.");

export const emailSchema = z.string().email("Invalid email address.");

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters long.")
  .max(30, "Username must be under 30 characters.")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain alphanumeric characters and underscores.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().min(2, "Display name must be at least 2 characters."),
  username: usernameSchema,
  role: z.enum(["employer", "worker", "resident", "student"]).default("worker"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export const updateEmailSchema = z.object({
  email: emailSchema,
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2, "Display name must be at least 2 characters.").optional(),
  avatarUrl: z.string().url("Invalid avatar URL format.").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits.").optional(),
  locale: z.string().min(2).optional(),
  timezone: z.string().min(2).optional(),
});
