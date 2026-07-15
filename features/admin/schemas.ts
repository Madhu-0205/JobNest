import { z } from "zod";

// ─────────────────────────────────────────────────────────────────
// Moderation Schemas
// ─────────────────────────────────────────────────────────────────

export const moderationActionSchema = z.object({
  itemId: z.string().uuid("Invalid moderation item ID"),
  action: z.enum(["approved", "rejected", "escalated"]),
  note: z.string().max(2000).optional(),
});

export const bulkModerationSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(["approved", "rejected", "escalated"]),
  note: z.string().max(2000).optional(),
});

// ─────────────────────────────────────────────────────────────────
// Support Ticket Schemas
// ─────────────────────────────────────────────────────────────────

export const createTicketSchema = z.object({
  subject: z.string().min(5).max(500),
  category: z.enum(["general", "payments", "kyc", "fraud", "technical", "account", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent", "critical"]).default("medium"),
  message: z.string().min(10).max(5000),
});

export const updateTicketStatusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "waiting_on_user", "escalated", "resolved", "closed"]),
});

export const addTicketMessageSchema = z.object({
  ticketId: z.string().uuid(),
  message: z.string().min(1).max(5000),
  isInternal: z.boolean().default(false),
});

// ─────────────────────────────────────────────────────────────────
// System Configuration Schemas
// ─────────────────────────────────────────────────────────────────

export const updateSettingSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.record(z.string(), z.unknown()),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
});

export const featureFlagSchema = z.object({
  flagKey: z.string().min(1).max(255),
  targetType: z.enum(["global", "role", "user"]).default("global"),
  targetId: z.string().optional(),
  isEnabled: z.boolean(),
});

// ─────────────────────────────────────────────────────────────────
// Report Generation Schemas
// ─────────────────────────────────────────────────────────────────

export const generateReportSchema = z.object({
  reportType: z.enum([
    "daily_summary",
    "weekly_revenue",
    "monthly_analytics",
    "worker_growth",
    "employer_growth",
    "fraud_summary",
    "trust_scores",
    "opportunity_analytics",
    "support_sla",
    "financial_reconciliation",
  ]),
  periodStart: z.string(),
  periodEnd: z.string(),
  filters: z.record(z.string(), z.unknown()).optional(),
});

export type ModerationActionInput = z.infer<typeof moderationActionSchema>;
export type BulkModerationInput = z.infer<typeof bulkModerationSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
export type FeatureFlagInput = z.infer<typeof featureFlagSchema>;
export type GenerateReportInput = z.infer<typeof generateReportSchema>;
