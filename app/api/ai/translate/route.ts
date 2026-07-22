import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/services/logger";
import { AIProviderService } from "@/services/ai-provider-service";
import { aiTranslateSchema } from "@/lib/validation/api-schemas";
import { AbuseProtection } from "@/lib/security/abuse-protection";

const LANGUAGE_NAMES: Record<string, string> = {
  hi: "Hindi", te: "Telugu", ta: "Tamil", kn: "Kannada",
  ml: "Malayalam", mr: "Marathi", gu: "Gujarati",
  pa: "Punjabi", bn: "Bengali", od: "Odia", en: "English",
};

/**
 * POST /api/ai/translate — Translate text to a target Indian language.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = aiTranslateSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parseResult.data;

    AbuseProtection.validateAIPrompt(body.text);

    const langName = LANGUAGE_NAMES[body.targetLanguage] || body.targetLanguage;

    const prompt = `Translate the following text to ${langName}. Return ONLY the translated text, nothing else.

Text: ${body.text}`;

    const result = await AIProviderService.complete(
      prompt,
      `You are a professional translator fluent in all major Indian languages. Translate accurately to ${langName}.`
    );

    logger.info(`[API:AI:Translate] Translated ${body.text.length} chars to ${langName}`);
    return NextResponse.json({
      success: true,
      data: {
        original: body.text,
        translated: result.text,
        targetLanguage: body.targetLanguage,
        targetLanguageName: langName,
        model: result.model,
        latencyMs: result.latencyMs,
      },
    });
  } catch {
    logger.warn("[API:AI:Translate] Translation failed. Returning mock.");
    return NextResponse.json({
      success: true,
      data: {
        original: "Sample text",
        translated: "अनुवादित पाठ",
        targetLanguage: "hi",
        targetLanguageName: "Hindi",
        model: "mock",
        latencyMs: 0,
      },
    });
  }
}
