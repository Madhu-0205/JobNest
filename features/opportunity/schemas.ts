import { z } from "zod";

export const opportunitySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(20, "Description must be at least 20 characters."),
  categoryId: z.string().uuid("Invalid category ID."),
  typeId: z.string().uuid("Invalid opportunity type ID."),
  pricingModel: z.enum(["hourly", "daily", "weekly", "monthly", "fixed", "negotiable"]),
  salaryMin: z.number().positive("Salary must be positive.").optional(),
  salaryMax: z.number().positive("Salary must be positive.").optional(),
  currency: z.string().default("INR"),
  
  // Hyperlocal Address Fields
  houseNumber: z.string().optional(),
  street: z.string().optional(),
  landmark: z.string().optional(),
  village: z.string().optional(),
  town: z.string().optional(),
  city: z.string().optional(),
  mandalTaluk: z.string().optional(),
  district: z.string().min(2, "District is required."),
  state: z.string().min(2, "State is required."),
  country: z.string().default("India").optional(),
  pincode: z.string().min(6, "Pincode must be at least 6 digits."),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  hiringRadiusMeters: z.number().int().min(500).default(5000),
  
  // Voice & Multimedia
  voiceIntroUrl: z.string().url("Invalid audio URL.").or(z.string().length(0)).optional(),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, "Invalid ISO timestamp format.").optional(),
});

export const applicationSchema = z.object({
  opportunityId: z.string().uuid("Invalid opportunity ID."),
  coverLetter: z.string().min(10, "Cover letter must be at least 10 characters.").optional(),
  resumeUrl: z.string().url("Invalid file URL.").or(z.string().length(0)).optional(),
  voiceIntroUrl: z.string().url("Invalid audio URL.").or(z.string().length(0)).optional(),
  expectedSalary: z.number().positive().optional(),
});

export const offerSchema = z.object({
  opportunityId: z.string().uuid("Invalid opportunity ID."),
  workerId: z.string().uuid("Invalid worker ID."),
  salaryOffered: z.number().positive("Salary must be positive."),
  terms: z.string().min(10, "Terms must details must be at least 10 characters."),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, "Invalid ISO timestamp format.").optional(),
});

export const reportSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  reason: z.string().min(3, "Reason is required."),
  description: z.string().min(10, "Description must be at least 10 characters.").optional(),
});
