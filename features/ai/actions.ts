"use server";

import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";
import {
  semanticSearchSchema,
  profileEnhanceSchema,
  translationRequestSchema,
} from "./schemas";
import { z } from "zod";
import { runWithRequestContext } from "@/lib/observability/request-context-helper";
import { logRequestLifecycle } from "@/lib/observability/request-logger";
import { ActionResult } from "@/features/auth/actions";
import { logger } from "@/services/logger";
import { AIProviderService } from "@/services/ai-provider-service";
import { RecommendationEngine } from "@/services/recommendation-engine";
import { SalaryIntelligence } from "@/services/salary-intelligence";

// ─────────────────────────────────────────────────────────────────
// Action Executor
// ─────────────────────────────────────────────────────────────────

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
          return { success: false, error: { code: "VALIDATION_ERROR", message: "Input validation failed.", details } };
        }
        const message = error instanceof Error ? error.message : "An unknown AI operation error occurred.";
        logger.warn(`[AI:${actionName}] ${message}`);
        return { success: false, error: { code: "AI_ACTION_ERROR", message } };
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────
// Semantic Search Action
// ─────────────────────────────────────────────────────────────────

export interface SemanticSearchResult {
  id: string;
  title: string;
  description: string;
  similarity: number;
  distance?: number;
}

export async function executeSemanticSearchAction(
  formData: FormData
): Promise<ActionResult<{ results: SemanticSearchResult[] }>> {
  return executeAction("executeSemanticSearchAction", async () => {
    await AuthorizationGuard.assertPermission(PERMISSIONS.JOBS_VIEW);

    const validated = semanticSearchSchema.parse({
      query: formData.get("query"),
      latitude: formData.get("latitude") ? parseFloat(formData.get("latitude") as string) : null,
      longitude: formData.get("longitude") ? parseFloat(formData.get("longitude") as string) : null,
      maxDistanceMeters: formData.get("maxDistanceMeters") ? parseFloat(formData.get("maxDistanceMeters") as string) : 5000,
    });

    const results = await RecommendationEngine.semanticMatch(
      validated.query,
      undefined,
      validated.latitude,
      validated.longitude,
      validated.maxDistanceMeters
    );

    logger.info(`[AI:SemanticSearch] Returned ${results.length} results for query: "${validated.query}"`);
    return { results: results as SemanticSearchResult[] };
  });
}

// ─────────────────────────────────────────────────────────────────
// Recommendation Action
// ─────────────────────────────────────────────────────────────────

export async function generateRecommendationsAction(
  type: "worker" | "employer" | "opportunity"
): Promise<ActionResult<{ candidates: RecommendationEngine extends never ? never : ReturnType<typeof transformCandidates> }>> {
  return executeAction("generateRecommendationsAction", async () => {
    const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_VIEW);

    const result = await RecommendationEngine.recommend(userId, type);
    return { candidates: transformCandidates(result.candidates) };
  });
}

function transformCandidates(candidates: { id: string; name: string; title: string; compositeScore: number }[]) {
  return candidates.map((c, i) => ({
    rank: i + 1,
    id: c.id,
    name: c.name,
    title: c.title,
    compositeScore: c.compositeScore,
  }));
}

// ─────────────────────────────────────────────────────────────────
// Profile Enhancement Action
// ─────────────────────────────────────────────────────────────────

export async function enhanceProfileDescriptionAction(
  formData: FormData
): Promise<ActionResult<{ enhanced: string; suggestions: string[] }>> {
  return executeAction("enhanceProfileDescriptionAction", async () => {
    await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_EDIT_OWN);

    const validated = profileEnhanceSchema.parse({
      fullName: formData.get("fullName"),
      currentDescription: formData.get("currentDescription"),
      skills: formData.get("skills") ? (formData.get("skills") as string).split(",").map((s) => s.trim()) : [],
    });

    const prompt = `Enhance this worker profile description for a hyperlocal job platform in India.
Name: ${validated.fullName}
Current Description: ${validated.currentDescription || "No description provided."}
Skills: ${validated.skills.join(", ") || "Not specified"}

Write a compelling, professional description in 2-3 sentences that highlights their strengths and reliability. Make it appealing to local employers.`;

    const result = await AIProviderService.complete(prompt, "You are a professional profile writer for a job platform in India.");

    const suggestions = [
      "Add a profile photo to increase trust by 40%",
      "List at least 3 specific skills to improve matching accuracy",
      "Include years of experience for better salary recommendations",
      "Add language preferences to match with local employers",
    ];

    return { enhanced: result.text, suggestions };
  });
}

// ─────────────────────────────────────────────────────────────────
// Translation Action
// ─────────────────────────────────────────────────────────────────

const LANGUAGE_NAMES: Record<string, string> = {
  hi: "Hindi", te: "Telugu", ta: "Tamil", kn: "Kannada",
  ml: "Malayalam", mr: "Marathi", gu: "Gujarati",
  pa: "Punjabi", bn: "Bengali", od: "Odia", en: "English",
};

export async function translateTextAction(
  formData: FormData
): Promise<ActionResult<{ translated: string; targetLanguage: string; targetLanguageName: string }>> {
  return executeAction("translateTextAction", async () => {
    await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_VIEW);

    const validated = translationRequestSchema.parse({
      text: formData.get("text"),
      targetLanguage: formData.get("targetLanguage"),
    });

    const langName = LANGUAGE_NAMES[validated.targetLanguage] || validated.targetLanguage;

    const prompt = `Translate the following text to ${langName}. Return ONLY the translated text, nothing else.

Text: ${validated.text}`;

    const result = await AIProviderService.complete(prompt, `You are a professional translator fluent in all major Indian languages. Translate accurately to ${langName}.`);

    return {
      translated: result.text,
      targetLanguage: validated.targetLanguage,
      targetLanguageName: langName,
    };
  });
}

// ─────────────────────────────────────────────────────────────────
// Salary Intelligence Action
// ─────────────────────────────────────────────────────────────────

export async function getSalaryIntelligenceAction(
  category: string,
  region?: string
): Promise<ActionResult<{ bands: ReturnType<typeof SalaryIntelligence.getSalaryBand> extends Promise<infer U> ? U : never }>> {
  return executeAction("getSalaryIntelligenceAction", async () => {
    await AuthorizationGuard.assertPermission(PERMISSIONS.JOBS_VIEW);

    const bands = await SalaryIntelligence.getSalaryBand(category, region);
    return { bands };
  });
}

// ─────────────────────────────────────────────────────────────────
// Skill Gap Action
// ─────────────────────────────────────────────────────────────────

export async function analyzeSkillGapAction(
  profileSkills: string[],
  requiredSkills: string[]
): Promise<ActionResult<ReturnType<typeof SalaryIntelligence.analyzeSkillGap>>> {
  return executeAction("analyzeSkillGapAction", async () => {
    await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_VIEW);
    return SalaryIntelligence.analyzeSkillGap(profileSkills, requiredSkills);
  });
}
