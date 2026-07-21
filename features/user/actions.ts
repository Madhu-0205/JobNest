"use server";

import { createServerClient } from "@/lib/supabase/server";
import {
  workerProfileSchema,
  employerProfileSchema,
  kycDocumentSchema,
  experienceSchema,
  educationSchema,
  certificationSchema,
  portfolioItemSchema,
  workerOnboardingSchema,
  employerOnboardingSchema,
  residentOnboardingSchema
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

/**
 * Server Action: Unified Worker Onboarding save.
 */
export async function saveWorkerOnboardingAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("saveWorkerOnboardingAction", async () => {
    const validated = workerOnboardingSchema.parse(formData);
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    // 1. Update main profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: validated.fullName,
        phone: validated.phone,
        avatar_url: validated.avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) throw new Error(profileError.message);

    // 2. Format Point geography string representation for spatial query fields
    const pointString = `POINT(${validated.longitude} ${validated.latitude})`;

    // 3. Upsert worker profile details
    const { error: workerError } = await supabase
      .from("worker_profiles")
      .upsert({
        user_id: user.id,
        job_title: validated.jobTitle,
        bio: validated.bio,
        experience_years: validated.experienceYears,
        service_radius_meters: validated.serviceRadiusMeters,
        location: pointString,
        expected_salary: validated.expectedSalary,
        availability: validated.availability,
        updated_at: new Date().toISOString(),
      });

    if (workerError) throw new Error(workerError.message);

    // 4. Update Skills (Worker skills mapping)
    await supabase.from("worker_skills").delete().eq("worker_id", user.id);

    for (const skillName of validated.skills) {
      let { data: skill } = await supabase
        .from("skills")
        .select("id")
        .eq("name", skillName)
        .maybeSingle();

      if (!skill) {
        const { data: newSkill, error: insertError } = await supabase
          .from("skills")
          .insert({ name: skillName, category: "General" })
          .select("id")
          .single();
        if (insertError) throw new Error(insertError.message);
        skill = newSkill;
      }

      if (skill) {
        await supabase
          .from("worker_skills")
          .insert({ worker_id: user.id, skill_id: skill.id });
      }
    }

    // 5. Update Languages
    await supabase.from("user_languages").delete().eq("user_id", user.id);
    for (const langName of validated.languages) {
      let { data: lang } = await supabase
        .from("languages")
        .select("id")
        .eq("name", langName)
        .maybeSingle();

      if (!lang) {
        const code = langName.substring(0, 2).toLowerCase();
        const { data: newLang, error: insertError } = await supabase
          .from("languages")
          .insert({ code, name: langName })
          .select("id")
          .single();
        if (insertError) throw new Error(insertError.message);
        lang = newLang;
      }

      if (lang) {
        await supabase
          .from("user_languages")
          .insert({ user_id: user.id, language_id: lang.id, proficiency: "fluent" });
      }
    }
  });
}

/**
 * Server Action: Unified Employer Onboarding save.
 */
export async function saveEmployerOnboardingAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("saveEmployerOnboardingAction", async () => {
    const validated = employerOnboardingSchema.parse(formData);
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    // 1. Update main profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: validated.ownerName,
        phone: validated.phoneNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) throw new Error(profileError.message);

    // 2. Format Point geography
    const pointString = `POINT(${validated.longitude} ${validated.latitude})`;

    // 3. Upsert employer profile details
    const { error: employerError } = await supabase
      .from("employer_profiles")
      .upsert({
        user_id: user.id,
        company_name: validated.companyName,
        industry: validated.industry,
        bio: validated.bio,
        gst_number: validated.gstNumber,
        location: pointString,
        categories: validated.categories,
        budget_range_min: validated.budgetRangeMin,
        budget_range_max: validated.budgetRangeMax,
        verification_status: "pending",
        updated_at: new Date().toISOString(),
      });

    if (employerError) throw new Error(employerError.message);
  });
}

/**
 * Server Action: Unified Resident Onboarding save.
 */
export async function saveResidentOnboardingAction(formData: unknown): Promise<ActionResult<void>> {
  return executeAction("saveResidentOnboardingAction", async () => {
    const validated = residentOnboardingSchema.parse(formData);
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    // 1. Upsert resident profile details
    const { error: residentError } = await supabase
      .from("resident_profiles")
      .upsert({
        user_id: user.id,
        saved_address: validated.savedAddress,
        preferred_language: validated.preferredLanguage,
        payment_method: validated.paymentMethod,
        updated_at: new Date().toISOString(),
      });

    if (residentError) throw new Error(residentError.message);
  });
}

