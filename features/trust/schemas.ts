import { z } from "zod";

/**
 * Validation schema for verification requests.
 */
export const verificationRequestSchema = z.object({
  requestType: z.enum(["identity", "business", "kyc"]),
  documentType: z.enum([
    "aadhaar",
    "pan",
    "passport",
    "driving_licence",
    "voter_id",
    "business_gst",
    "selfie",
    "live_photo",
    "video"
  ]),
  documentNumber: z.string().min(1, "Document identification number is required.").optional().nullable(),
  fileUrl: z.string().url("Valid document file URL is required."),
  expiryDate: z.string().optional().nullable(),
});

/**
 * Validation schema for business GST and details verification.
 */
export const businessVerificationSchema = z.object({
  gstNumber: z.string().regex(/^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})?$/, "Invalid GST format.").optional().nullable(),
  registrationNumber: z.string().min(1, "Registration code is required.").optional().nullable(),
  businessName: z.string().min(2, "Business name is required."),
  businessAddress: z.string().min(10, "Full business address is required."),
  authorizedContact: z.string().min(2, "Authorized contact name is required."),
  businessCategory: z.string().min(2, "Business sector category is required."),
});

/**
 * Validation schema for reviews & ratings.
 */
export const reviewSubmitSchema = z.object({
  opportunityId: z.string().uuid().optional().nullable(),
  revieweeId: z.string().uuid("Invalid reviewee profile key."),
  score: z.number().min(1).max(5, "Rating must be between 1.0 and 5.0."),
  categoryScores: z.record(z.string(), z.number()).default({}),
  ratingType: z.enum(["worker", "employer"]),
  reviewText: z.string().min(5, "Review description text must contain at least 5 characters."),
  attachments: z.array(z.string().url()).default([]),
});

/**
 * Validation schema for opening a dispute.
 */
export const disputeSubmitSchema = z.object({
  opportunityId: z.uuid("Opportunity key is required."),
  respondentId: z.uuid("Respondent identity key is required."),
  reason: z.string().min(5, "Dispute reason must be specified."),
  description: z.string().min(15, "Please describe the dispute situation with context."),
});

/**
 * Validation schema for triggering SOS emergency alerts.
 */
export const emergencySosSchema = z.object({
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  contactPhone: z.string().optional().nullable(),
});

/**
 * Validation schema for report submissions.
 */
export const reportSubmitSchema = z.object({
  reportedUserId: z.string().uuid().optional().nullable(),
  opportunityId: z.string().uuid().optional().nullable(),
  reason: z.string().min(3, "Reason title is required."),
  category: z.enum([
    "fraud",
    "spam",
    "fake_profile",
    "fake_opportunity",
    "harassment",
    "abuse",
    "unsafe_behaviour",
    "copyright",
    "other"
  ]),
  description: z.string().optional().nullable(),
  evidence: z.array(
    z.object({
      fileUrl: z.string().url("Valid evidence attachment file URL is required."),
      fileType: z.enum(["screenshot", "image", "video", "voice_note"]),
    })
  ).default([]),
});
