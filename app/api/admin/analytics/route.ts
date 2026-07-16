import { NextResponse } from "next/server";
import { logger } from "@/services/logger";
import { AnalyticsEngine } from "@/services/analytics-engine";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";

/**
 * GET /api/admin/analytics — Secure full analytics dashboard payload.
 */
export async function GET() {
  try {
    // 1. Enforce strict permissions authorization check
    try {
      await AuthorizationGuard.assertPermission(PERMISSIONS.ANALYTICS_VIEW);
    } catch {
      return NextResponse.json({ success: false, error: "Access denied. Insufficient permissions." }, { status: 403 });
    }

    const dashboard = await AnalyticsEngine.getDashboard();
    logger.info("[API:Admin:Analytics] Dashboard payload fetched.");
    return NextResponse.json({ success: true, data: dashboard });
  } catch (err) {
    logger.error("[API:Admin:Analytics] Dashboard load failed:", err as Record<string, unknown>);
    return NextResponse.json({ success: false, error: "Dashboard load failed." }, { status: 500 });
  }
}
