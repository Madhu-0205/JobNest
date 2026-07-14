"use server";

import { createServerClient } from "@/lib/supabase/server";
import {
  workerProfileSchema,
  employerProfileSchema,
  kycDocumentSchema,
  experienceSchema,
  educationSchema,
  certificationSchema,
  portfolioItemSchema
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
 * Server Action: Creates or updates the user's worker profile.
 */
export async function saveWorkerProfileAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("saveWorkerProfileAction", async () => {
    const validated = workerProfileSchema.parse(formData);
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    // Format Point geometry string representation for spatial query fields
    const pointString = validated.latitude && validated.longitude
      ? `POINT(${validated.longitude} ${validated.latitude})`
      : null;

    const { error } = await supabase
      .from("worker_profiles")
      .upsert({
        user_id: user.id,
        job_title: validated.jobTitle,
        bio: validated.bio,
        experience_years: validated.experienceYears,
        service_radius_meters: validated.serviceRadiusMeters,
        location: pointString,
        preferred_work_area: validated.preferredWorkArea,
        travel_distance_km: validated.travelDistanceKm,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Creates or updates the user's employer profile.
 */
export async function saveEmployerProfileAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("saveEmployerProfileAction", async () => {
    const validated = employerProfileSchema.parse(formData);
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { error } = await supabase
      .from("employer_profiles")
      .upsert({
        user_id: user.id,
        company_name: validated.companyName,
        company_website: validated.companyWebsite,
        industry: validated.industry,
        bio: validated.bio,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Adds work experience.
 */
export async function addExperienceAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("addExperienceAction", async () => {
    const validated = experienceSchema.parse(formData);
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { error } = await supabase
      .from("experiences")
      .insert({
        user_id: user.id,
        company_name: validated.companyName,
        role_title: validated.roleTitle,
        start_date: validated.startDate,
        end_date: validated.endDate || null,
        description: validated.description || null,
      });

    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Adds educational history.
 */
export async function addEducationAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("addEducationAction", async () => {
    const validated = educationSchema.parse(formData);
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { error } = await supabase
      .from("educations")
      .insert({
        user_id: user.id,
        institution: validated.institution,
        degree: validated.degree,
        field_of_study: validated.fieldOfStudy || null,
        start_date: validated.startDate,
        end_date: validated.endDate || null,
      });

    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Adds professional certifications.
 */
export async function addCertificationAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("addCertificationAction", async () => {
    const validated = certificationSchema.parse(formData);
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { error } = await supabase
      .from("certifications")
      .insert({
        user_id: user.id,
        name: validated.name,
        issuing_organization: validated.issuingOrganization,
        issue_date: validated.issueDate,
        expiry_date: validated.expiryDate || null,
        credential_id: validated.credentialId || null,
        credential_url: validated.credentialUrl || null,
      });

    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Adds project items to portfolio.
 */
export async function addPortfolioItemAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("addPortfolioItemAction", async () => {
    const validated = portfolioItemSchema.parse(formData);
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { error } = await supabase
      .from("portfolio_items")
      .insert({
        user_id: user.id,
        title: validated.title,
        description: validated.description || null,
        media_url: validated.mediaUrl || null,
        project_url: validated.projectUrl || null,
      });

    if (error) {
      throw new Error(error.message);
    }
  });
}

/**
 * Server Action: Submits verification documents for KYC approval.
 */
export async function uploadKycDocumentAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("uploadKycDocumentAction", async () => {
    const validated = kycDocumentSchema.parse(formData);
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { error } = await supabase
      .from("kyc_documents")
      .insert({
        user_id: user.id,
        document_type: validated.documentType,
        document_number: validated.documentNumber,
        file_url: validated.fileUrl,
        status: "pending",
      });

    if (error) {
      throw new Error(error.message);
    }
  });
}
