import { z } from "zod";

// Admin API Schemas
export const adminConfigSchema = z.object({
  flagKey: z.string().min(1, "flagKey parameter is required."),
  isEnabled: z.boolean().optional(),
  targetType: z.string().optional(),
  targetId: z.string().optional(),
});

export const adminSupportSchema = z.object({
  ticketId: z.string().min(1, "ticketId parameter is required."),
  status: z.string().min(1, "status parameter is required."),
});

export const adminReportSchema = z.object({
  reportType: z.string().min(1, "reportType parameter is required."),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});

export const adminModerationSchema = z.object({
  itemId: z.string().min(1, "itemId is required."),
  action: z.enum(["approved", "rejected", "escalated"]),
  note: z.string().optional(),
});

// AI API Schemas
export const aiTranslateSchema = z.object({
  text: z.string().min(1, "text parameter is required."),
  targetLanguage: z.string().min(2, "targetLanguage is required."),
});

export const aiSearchSchema = z.object({
  query: z.string().min(1, "query parameter is required."),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  maxDistanceMeters: z.number().optional(),
});

export const aiProfileSchema = z.object({
  fullName: z.string().min(1, "fullName is required."),
  currentDescription: z.string().optional(),
  skills: z.array(z.string()).optional(),
});
