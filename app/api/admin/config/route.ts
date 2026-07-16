import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";

/**
 * GET /api/admin/config — Secure feature flags and system settings.
 */
export async function GET() {
  try {
    // 1. Authenticate and authorize GET access
    try {
      await AuthorizationGuard.assertPermission(PERMISSIONS.CONFIG_VIEW);
    } catch {
      return NextResponse.json({ success: false, error: "Access denied. Insufficient permissions." }, { status: 403 });
    }

    const supabase = await createServerClient();

    const [flagsRes, settingsRes] = await Promise.allSettled([
      supabase.from("feature_flag_overrides").select("*").eq("target_type", "global"),
      supabase.from("system_settings").select("*").order("category"),
    ]);

    const flags = flagsRes.status === "fulfilled" && flagsRes.value.data
      ? Object.fromEntries(flagsRes.value.data.map((f) => [f.flag_key, f.is_enabled]))
      : {};

    const settings = settingsRes.status === "fulfilled" && settingsRes.value.data
      ? settingsRes.value.data
      : [];

    logger.info("[API:Admin:Config] Config loaded from live database.");
    return NextResponse.json({ success: true, data: { flags, settings } });
  } catch (err) {
    logger.error("[API:Admin:Config] Config load error:", err as Record<string, unknown>);
    return NextResponse.json({ success: false, error: "Failed to load configuration." }, { status: 500 });
  }
}

/**
 * POST /api/admin/config — Securely update a feature flag override.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate and authorize POST access
    let userId: string;
    try {
      userId = await AuthorizationGuard.assertPermission(PERMISSIONS.CONFIG_MANAGE);
    } catch {
      return NextResponse.json({ success: false, error: "Access denied. Insufficient privileges." }, { status: 403 });
    }

    const body = await req.json() as { flagKey?: string; isEnabled?: boolean; targetType?: string; targetId?: string };
    if (!body.flagKey) {
      return NextResponse.json({ success: false, error: "flagKey parameter is required." }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { error } = await supabase.from("feature_flag_overrides").insert({
      flag_key: body.flagKey,
      target_type: body.targetType || "global",
      target_id: body.targetId || "global",
      is_enabled: !!body.isEnabled,
      created_by: userId,
    });

    if (error) throw error;

    logger.info(`[API:Admin:Config] Flag ${body.flagKey} set to ${body.isEnabled} by user ${userId}`);
    return NextResponse.json({ success: true, data: { flagKey: body.flagKey, isEnabled: body.isEnabled } });
  } catch (err) {
    logger.error("[API:Admin:Config] Config update failed:", err as Record<string, unknown>);
    return NextResponse.json({ success: false, error: "Config update failed." }, { status: 500 });
  }
}
