/**
 * Central constants registry for the JobNest application.
 * Defines globally shared metadata, constraints, and business rules.
 */

export const APP_NAME = "JobNest";

export const APP_VERSION = "2.0.0-alpha.1";

export const SUPPORTED_CURRENCIES = ["INR", "USD"] as const;

export const DEFAULT_CURRENCY = "INR";

export const MAX_FILE_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 Megabytes

export const GIG_STATUSES = {
  OPEN: "open",
  HIRED: "hired",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type GigStatus = typeof GIG_STATUSES[keyof typeof GIG_STATUSES];
