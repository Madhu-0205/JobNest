"use server";

import { createServerClient } from "@/lib/supabase/server";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";
import {
  verificationRequestSchema,
  businessVerificationSchema,
  reviewSubmitSchema,
  disputeSubmitSchema,
  emergencySosSchema,
  reportSubmitSchema
} from "./schemas";
import { z } from "zod";
import { runWithRequestContext } from "@/lib/observability/request-context-helper";
import { logRequestLifecycle } from "@/lib/observability/request-logger";
import { ActionResult } from "@/features/auth/actions";
import { TrustScoreEngine } from "@/services/trust-score-engine";
import { SafetyService } from "@/services/safety-service";

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
 * Server Action: Submits a verification request with Aadhaar, PAN, Passport, Voter, or Selfie.
 */
export async function submitVerificationRequestAction(formData: unknown): Promise<ActionResult<{ requestId: string }>> {
  return executeAction("submitVerificationRequestAction", async () => {
    const validated = verificationRequestSchema.parse(formData);
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_EDIT_OWN);
    const supabase = await createServerClient();

      // 1. Create verification request
      const { data: request, error: reqErr } = await supabase
        .from("verification_requests")
        .insert({
          user_id: userId,
          request_type: validated.requestType,
          status: "submitted",
        })
        .select("id")
        .single();

      if (reqErr || !request) throw reqErr || new Error("Failed to register request.");

      // 2. Insert document attachment
      const { error: docErr } = await supabase
        .from("verification_documents")
        .insert({
          request_id: request.id,
          document_type: validated.documentType,
          document_number: validated.documentNumber || null,
          file_url: validated.fileUrl,
          expiry_date: validated.expiryDate || null,
          status: "pending",
        });

      if (docErr) throw docErr;

      // 3. Log initial history
      await supabase
        .from("verification_history")
        .insert({
          request_id: request.id,
          user_id: userId,
          status: "submitted",
          notes: "Verification documents uploaded by user.",
        });

      return { requestId: request.id };
  });
}

/**
 * Server Action: Submits business details with GST numbers.
 */
export async function submitBusinessVerificationAction(formData: unknown): Promise<ActionResult<{ businessId: string }>> {
  return executeAction("submitBusinessVerificationAction", async () => {
    const validated = businessVerificationSchema.parse(formData);
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_EDIT_OWN);
    const supabase = await createServerClient();

      const { data: request } = await supabase
        .from("verification_requests")
        .insert({
          user_id: userId,
          request_type: "business",
          status: "submitted",
        })
        .select("id")
        .single();

      const requestId = request?.id || null;

      const { data: biz, error } = await supabase
        .from("business_verifications")
        .insert({
          user_id: userId,
          gst_number: validated.gstNumber || null,
          registration_number: validated.registrationNumber || null,
          business_name: validated.businessName,
          business_address: validated.businessAddress,
          authorized_contact: validated.authorizedContact,
          business_category: validated.businessCategory,
          status: "pending",
          verification_request_id: requestId,
        })
        .select("id")
        .single();

      if (error) throw error;

      return { businessId: biz.id };
  });
}

/**
 * Server Action: Submits a review and rating, then triggers a Trust Score recalculation.
 */
export async function submitReviewAction(formData: unknown): Promise<ActionResult<{ reviewId: string }>> {
  return executeAction("submitReviewAction", async () => {
    const validated = reviewSubmitSchema.parse(formData);
    const reviewerId = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_EDIT_OWN);
    const supabase = await createServerClient();

      // 1. Write Rating
      const { data: rating, error: ratErr } = await supabase
        .from("ratings")
        .insert({
          reviewer_id: reviewerId,
          reviewee_id: validated.revieweeId,
          opportunity_id: validated.opportunityId || null,
          score: validated.score,
          category_scores: validated.categoryScores as Record<string, unknown>,
          rating_type: validated.ratingType,
        })
        .select("id")
        .single();

      if (ratErr || !rating) throw ratErr || new Error("Failed to insert rating.");

      // 2. Write Review
      const { data: review, error: revErr } = await supabase
        .from("reviews")
        .insert({
          opportunity_id: validated.opportunityId || null,
          reviewer_id: reviewerId,
          reviewee_id: validated.revieweeId,
          rating_id: rating.id,
          review_text: validated.reviewText,
          is_verified: true, // Review verified since reviewer has application records
          status: "approved",
          attachments: validated.attachments,
        })
        .select("id")
        .single();

      if (revErr || !review) throw revErr || new Error("Failed to insert review.");

      // 3. Trigger Trust Score calculation asynchronously
      await TrustScoreEngine.calculateAndUpdate(validated.revieweeId);

      return { reviewId: review.id };
  });
}

/**
 * Server Action: Opens a dispute on an opportunity.
 */
export async function submitDisputeAction(formData: unknown): Promise<ActionResult<{ disputeId: string }>> {
  return executeAction("submitDisputeAction", async () => {
    const validated = disputeSubmitSchema.parse(formData);
    const initiatorId = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_EDIT_OWN);
    const supabase = await createServerClient();

      const { data: dispute, error } = await supabase
        .from("disputes")
        .insert({
          opportunity_id: validated.opportunityId,
          initiator_id: initiatorId,
          respondent_id: validated.respondentId,
          reason: validated.reason,
          description: validated.description,
          status: "open",
        })
        .select("id")
        .single();

      if (error) throw error;

      return { disputeId: dispute.id };
  });
}

/**
 * Server Action: Triggers emergency SOS alert.
 */
export async function triggerSosAlertAction(
  opportunityId: string | null,
  formData: unknown
): Promise<ActionResult<{ incidentId: string; alertedCount: number }>> {
  return executeAction("triggerSosAlertAction", async () => {
    const validated = emergencySosSchema.parse(formData);
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_EDIT_OWN);

    const result = await SafetyService.triggerEmergencySos(userId, opportunityId, {
      latitude: validated.latitude,
      longitude: validated.longitude,
    });

    return result;
  });
}

/**
 * Server Action: Submits user or opportunity reports.
 */
export async function submitReportAction(formData: unknown): Promise<ActionResult<{ reportId: string }>> {
  return executeAction("submitReportAction", async () => {
    const validated = reportSubmitSchema.parse(formData);
    const reporterId = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_EDIT_OWN);
    const supabase = await createServerClient();

      // 1. Insert Report
      const { data: report, error: repErr } = await supabase
        .from("reports")
        .insert({
          reporter_id: reporterId,
          reported_user_id: validated.reportedUserId || null,
          opportunity_id: validated.opportunityId || null,
          reason: validated.reason,
          category: validated.category,
          description: validated.description || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (repErr || !report) throw repErr || new Error("Failed to insert report.");

      // 2. Insert Evidence
      if (validated.evidence.length > 0) {
        const evidenceRows = validated.evidence.map((ev) => ({
          report_id: report.id,
          file_url: ev.fileUrl,
          file_type: ev.fileType,
        }));

        await supabase.from("report_evidence").insert(evidenceRows);
      }

      return { reportId: report.id };
  });
}

/**
 * Server Action: Handles moderator decisions (KYC approvals, disputes resolution, user suspensions).
 */
export async function performModeratorAction(
  targetType: "kyc" | "business" | "dispute" | "review" | "suspension",
  targetId: string,
  action: string, // approve, reject, resolve, delete, suspend, ban
  notes?: string
): Promise<ActionResult<{ success: boolean }>> {
  return executeAction("performModeratorAction", async () => {
    const modId = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_VERIFY);
    const supabase = await createServerClient();

      if (targetType === "kyc") {
        const { error } = await supabase
          .from("verification_requests")
          .update({
            status: action === "approve" ? "approved" : "rejected",
            notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetId);

        if (error) throw error;

        // Fetch user_id of request to grant badge
        const { data: req } = await supabase
          .from("verification_requests")
          .select("user_id")
          .eq("id", targetId)
          .single();

        if (req && action === "approve") {
          // Grant "verified_identity" badge
          const { data: badge } = await supabase
            .from("badges")
            .select("id")
            .eq("code", "verified_identity")
            .maybeSingle();

          if (badge) {
            await supabase.from("user_badges").insert({
              user_id: req.user_id,
              badge_id: badge.id,
            });
          }

          // Recalculate trust score
          await TrustScoreEngine.calculateAndUpdate(req.user_id);
        }
      } else if (targetType === "business") {
        const { error } = await supabase
          .from("business_verifications")
          .update({
            status: action === "approve" ? "approved" : "rejected",
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetId);

        if (error) throw error;

        // Fetch user_id of request to grant badge
        const { data: biz } = await supabase
          .from("business_verifications")
          .select("user_id")
          .eq("id", targetId)
          .single();

        if (biz && action === "approve") {
          // Grant "verified_business" badge
          const { data: badge } = await supabase
            .from("badges")
            .select("id")
            .eq("code", "verified_business")
            .maybeSingle();

          if (badge) {
            await supabase.from("user_badges").insert({
              user_id: biz.user_id,
              badge_id: badge.id,
            });
          }

          // Recalculate trust score
          await TrustScoreEngine.calculateAndUpdate(biz.user_id);
        }
      } else if (targetType === "dispute") {
        const { error } = await supabase
          .from("disputes")
          .update({
            status: "resolved",
            resolution_details: notes || "Resolved by moderator.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetId);

        if (error) throw error;
      } else if (targetType === "suspension") {
        const { error } = await supabase
          .from("moderation_actions")
          .insert({
            moderator_id: modId,
            target_user_id: targetId,
            action_type: action, // suspend, ban
            reason: notes || "Policy violation.",
            expires_at: action === "suspend" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null, // 7 days default
          });

        if (error) throw error;
      }

      return { success: true };
  });
}
