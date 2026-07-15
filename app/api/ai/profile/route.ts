import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/services/logger";
import { AIProviderService } from "@/services/ai-provider-service";

/**
 * POST /api/ai/profile — Enhance a worker's profile description using AI.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      fullName?: string;
      currentDescription?: string;
      skills?: string[];
    };

    if (!body.fullName) {
      return NextResponse.json({ success: false, error: "fullName is required." }, { status: 400 });
    }

    const prompt = `Enhance this worker profile description for a hyperlocal job platform in India.
Name: ${body.fullName}
Current Description: ${body.currentDescription || "No description provided."}
Skills: ${(body.skills || []).join(", ") || "Not specified"}

Write a compelling, professional description in 2-3 sentences that highlights their strengths and reliability.`;

    const result = await AIProviderService.complete(prompt, "You are a professional profile writer for a job platform in India.");

    logger.info(`[API:AI:Profile] Enhanced profile for: ${body.fullName}`);
    return NextResponse.json({
      success: true,
      data: {
        enhanced: result.text,
        model: result.model,
        latencyMs: result.latencyMs,
        suggestions: [
          "Add a profile photo to increase trust by 40%",
          "List at least 3 specific skills to improve matching accuracy",
          "Include years of experience for better salary recommendations",
        ],
      },
    });
  } catch {
    logger.warn("[API:AI:Profile] Profile enhancement failed. Returning mock.");
    return NextResponse.json({
      success: true,
      data: {
        enhanced: "Experienced professional with strong dedication to quality work and consistent reliability. Skilled in delivering results across multiple domains with attention to detail.",
        model: "mock",
        latencyMs: 0,
        suggestions: ["Add a profile photo", "List specific skills"],
      },
    });
  }
}
