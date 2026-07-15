import { z } from "zod";

/**
 * Validation schema for semantic search options.
 */
export const semanticSearchSchema = z.object({
  query: z.string().min(1, "Natural language query is required."),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  maxDistanceMeters: z.number().positive().default(5000),
});

/**
 * Validation schema for profile text enhancement.
 */
export const profileEnhanceSchema = z.object({
  fullName: z.string().min(1, "Name is required."),
  currentDescription: z.string().optional().nullable(),
  skills: z.array(z.string()).default([]),
});

/**
 * Validation schema for dynamic translations.
 */
export const translationRequestSchema = z.object({
  text: z.string().min(1, "Text to translate is required."),
  targetLanguage: z.string().min(2).max(10), // e.g. hi, te, ta, kn
});
