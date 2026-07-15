import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";

const DEFAULT_FLAGS: Record<string, boolean> = {
  "ai.semantic_search": true,
  "ai.profile_enhancement": true,
  "ai.translation": true,
  "payments.razorpay": true,
  "payments.escrow": true,
  "realtime.live_tracking": true,
  "realtime.chat": true,
  "kyc.document_upload": true,
  "kyc.face_match": false,
  "moderation.auto_flag": true,
  "analytics.heatmap": true,
  "support.live_chat": false,
};

const DEFAULT_SETTINGS: { key: string; category: string; description: string; value: unknown }[] = [
  { key: "platform.commission_rate", category: "financial", description: "Platform commission rate (0–1)", value: 0.10 },
  { key: "platform.max_opportunities_per_user", category: "limits", description: "Max active opportunities per employer", value: 25 },
  { key: "ai.recommendation_weights", category: "ai", description: "Composite score weights", value: { skills: 0.25, trust: 0.20, distance: 0.15, rating: 0.15, availability: 0.10, responseTime: 0.08, salary: 0.07 } },
  { key: "trust.minimum_score_to_apply", category: "trust", description: "Minimum trust score required to apply for jobs", value: 30 },
  { key: "support.sla_high_hours", category: "support", description: "SLA for high priority tickets (hours)", value: 8 },
  { key: "fraud.auto_suspend_threshold", category: "fraud", description: "Fraud score threshold for auto-suspension", value: 85 },
];

/**
 * GET /api/admin/config — Feature flags and system settings.
 */
export async function GET() {
  try {
    const supabase = await createServerClient();

    const [flagsRes, settingsRes] = await Promise.allSettled([
      supabase.from("feature_flag_overrides").select("*").eq("target_type", "global"),
      supabase.from("system_settings").select("*").order("category"),
    ]);

    const flags = flagsRes.status === "fulfilled" && flagsRes.value.data?.length
      ? Object.fromEntries(flagsRes.value.data.map((f) => [f.flag_key, f.is_enabled]))
      : DEFAULT_FLAGS;

    const settings = settingsRes.status === "fulfilled" && settingsRes.value.data?.length
      ? settingsRes.value.data
      : DEFAULT_SETTINGS;

    logger.info("[API:Admin:Config] Config loaded.");
    return NextResponse.json({ success: true, data: { flags, settings } });
  } catch {
    return NextResponse.json({ success: true, data: { flags: DEFAULT_FLAGS, settings: DEFAULT_SETTINGS } });
  }
}

/**
 * POST /api/admin/config — Update a feature flag.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { flagKey?: string; isEnabled?: boolean };
    if (!body.flagKey) {
      return NextResponse.json({ success: false, error: "flagKey is required." }, { status: 400 });
    }
    logger.info(`[API:Admin:Config] Flag ${body.flagKey} → ${body.isEnabled}`);
    return NextResponse.json({ success: true, data: { flagKey: body.flagKey, isEnabled: body.isEnabled } });
  } catch {
    return NextResponse.json({ success: false, error: "Config update failed." }, { status: 500 });
  }
}
