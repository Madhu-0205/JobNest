"use server";

import { createServerClient } from "@/lib/supabase/server";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";
import {
  opportunitySchema,
  applicationSchema,
  offerSchema,
  reportSchema
} from "./schemas";
import { z } from "zod";
import { runWithRequestContext } from "@/lib/observability/request-context-helper";
import { logRequestLifecycle } from "@/lib/observability/request-logger";
import { ActionResult } from "@/features/auth/actions";

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
 * Server Action: Creates a new hyperlocal opportunity (Gig, Job, Chores).
 */
export async function createOpportunityAction(formData: unknown): Promise<ActionResult<{ opportunityId: string }>> {
  return executeAction("createOpportunityAction", async () => {
    const validated = opportunitySchema.parse(formData);
    
    // Check permission to post jobs
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.JOBS_CREATE);
    const supabase = await createServerClient();

    // Map address Point geometry
    const pointString = validated.latitude && validated.longitude
      ? `POINT(${validated.longitude} ${validated.latitude})`
      : null;

    const { data: opportunity, error } = await supabase
      .from("opportunities")
      .insert({
        employer_id: userId,
        category_id: validated.categoryId,
        type_id: validated.typeId,
        title: validated.title,
        description: validated.description,
        status: "draft", // Starts as draft state
        pricing_model: validated.pricingModel,
        salary_min: validated.salaryMin,
        salary_max: validated.salaryMax,
        currency: validated.currency,
        house_number: validated.houseNumber,
        street: validated.street,
        landmark: validated.landmark,
        village: validated.village,
        town: validated.town,
        city: validated.city,
        mandal_taluk: validated.mandalTaluk,
        district: validated.district,
        state: validated.state,
        country: validated.country,
        pincode: validated.pincode,
        location: pointString,
        hiring_radius_meters: validated.hiringRadiusMeters,
        voice_intro_url: validated.voiceIntroUrl,
        expires_at: validated.expiresAt,
      })
      .select("id")
      .single();

    if (error || !opportunity) {
      throw new Error(error?.message || "Failed to create opportunity.");
    }

    return { opportunityId: opportunity.id };
  });
}

/**
 * Server Action: Publishes a draft opportunity.
 */
export async function publishOpportunityAction(opportunityId: string): Promise<ActionResult<void>> {
  return executeAction("publishOpportunityAction", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    // Enforce ownership check or admin privileges
    const { data: opportunity } = await supabase
      .from("opportunities")
      .select("employer_id")
      .eq("id", opportunityId)
      .single();

    if (!opportunity) throw new Error("Opportunity not found.");
    if (opportunity.employer_id !== user.id) {
      // Allow admin override
      await AuthorizationGuard.assertRole("admin");
    }

    const { error } = await supabase
      .from("opportunities")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", opportunityId);

    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Submits a quick or detailed job application.
 */
export async function applyOpportunityAction(formData: unknown): Promise<ActionResult<{ applicationId: string }>> {
  return executeAction("applyOpportunityAction", async () => {
    const validated = applicationSchema.parse(formData);
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.JOBS_APPLY);
    const supabase = await createServerClient();

    // Verify opportunity is published
    const { data: opportunity } = await supabase
      .from("opportunities")
      .select("status")
      .eq("id", validated.opportunityId)
      .single();

    if (!opportunity || opportunity.status !== "published") {
      throw new Error("Application failed: Opportunity is not open or published.");
    }

    const { data: application, error } = await supabase
      .from("applications")
      .insert({
        opportunity_id: validated.opportunityId,
        worker_id: userId,
        status: "applied",
        cover_letter: validated.coverLetter,
        resume_url: validated.resumeUrl,
        voice_intro_url: validated.voiceIntroUrl,
        expected_salary: validated.expectedSalary,
      })
      .select("id")
      .single();

    if (error || !application) {
      throw new Error(error?.message || "Failed to submit application.");
    }

    // Log application status state machine change
    await supabase.from("application_status_history").insert({
      application_id: application.id,
      status: "applied",
      comment: "Application submitted.",
    });

    return { applicationId: application.id };
  });
}

/**
 * Server Action: Shortlists an application.
 */
export async function shortlistApplicationAction(applicationId: string): Promise<ActionResult<void>> {
  return executeAction("shortlistApplicationAction", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    // Validate current user is owner of the opportunity
    const { data: application } = await supabase
      .from("applications")
      .select("opportunity_id")
      .eq("id", applicationId)
      .single();

    if (!application) throw new Error("Application not found.");

    const { data: opportunity } = await supabase
      .from("opportunities")
      .select("employer_id")
      .eq("id", application.opportunity_id)
      .single();

    if (!opportunity || opportunity.employer_id !== user.id) {
      throw new Error("Unauthorized: Only the opportunity owner can shortlist candidates.");
    }

    const { error } = await supabase
      .from("applications")
      .update({ status: "shortlisted", updated_at: new Date().toISOString() })
      .eq("id", applicationId);

    if (error) {
      throw new Error(error.message);
    }

    // Record timeline step
    await supabase.from("application_status_history").insert({
      application_id: applicationId,
      status: "shortlisted",
      comment: "Candidate shortlisted.",
    });
  });
}

/**
 * Server Action: Dispatches a formal contract job offer.
 */
export async function makeOfferAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("makeOfferAction", async () => {
    const validated = offerSchema.parse(formData);
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    // Ownership check
    const { data: opportunity } = await supabase
      .from("opportunities")
      .select("employer_id")
      .eq("id", validated.opportunityId)
      .single();

    if (!opportunity || opportunity.employer_id !== user.id) {
      throw new Error("Unauthorized: Only the opportunity owner can create offers.");
    }

    const { error } = await supabase
      .from("offers")
      .insert({
        opportunity_id: validated.opportunityId,
        worker_id: validated.workerId,
        status: "pending",
        salary_offered: validated.salaryOffered,
        terms: validated.terms,
        expires_at: validated.expiresAt,
      });

    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Worker accepts an offer.
 */
export async function acceptOfferAction(offerId: string): Promise<ActionResult<void>> {
  return executeAction("acceptOfferAction", async () => {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { data: offer } = await supabase
      .from("offers")
      .select("worker_id, status")
      .eq("id", offerId)
      .single();

    if (!offer) throw new Error("Offer not found.");
    if (offer.worker_id !== user.id) {
      throw new Error("Unauthorized: You cannot accept an offer sent to another worker.");
    }
    if (offer.status !== "pending") {
      throw new Error("Acceptance failed: Offer is no longer active.");
    }

    const { error } = await supabase
      .from("offers")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", offerId);

    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Files an abuse or spam report on a profile or opportunity.
 */
export async function submitReportAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("submitReportAction", async () => {
    const validated = reportSchema.parse(formData);
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { error } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        reported_user_id: validated.reportedUserId || null,
        opportunity_id: validated.opportunityId || null,
        reason: validated.reason,
        description: validated.description || null,
        status: "pending",
      });

    if (error) {
      throw new Error(error.message);
    }
  });
}
