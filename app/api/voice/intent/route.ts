import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { AIProviderService } from "@/services/ai-provider-service";
import { extractVoiceIntentAction } from "@/features/voice/actions";
import { logger } from "@/services/logger";

const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (audioFile.size > MAX_AUDIO_SIZE) {
      return NextResponse.json({ error: "Audio file too large. Maximum is 5MB." }, { status: 413 });
    }

    const mimeType = audioFile.type || "audio/webm";
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Transcribe the audio
    const transcript = await AIProviderService.transcribe(buffer, mimeType);

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ 
        transcript: "", 
        intent: { 
          intent: "AMBIGUOUS", 
          clarification_question: "I didn't hear anything. Could you try speaking again?" 
        } 
      });
    }

    // 2. Extract structured intent
    const intent = await extractVoiceIntentAction(transcript);

    // 3. Log securely without raw audio
    logger.info(`[VoiceAPI] Processed voice intent for ${user.id}`, { 
      intentType: intent.intent,
      mode: intent.mode,
      confidence: intent.confidence
    });

    return NextResponse.json({ transcript, intent });
  } catch (error) {
    logger.error("[VoiceAPI] Failed to process voice request", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("429") || msg.includes("rate limit") || msg.includes("Rate limit")) {
      return NextResponse.json(
        { error: "AI assistant is temporarily busy due to high demand. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": "10" } }
      );
    }
    return NextResponse.json({ error: "Failed to process voice request." }, { status: 500 });
  }
}
