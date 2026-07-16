import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";

/**
 * GET /api/admin/audit — Secure searchable audit log.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Enforce strict permissions authorization check
    try {
      await AuthorizationGuard.assertPermission(PERMISSIONS.AUDIT_VIEW);
    } catch {
      return NextResponse.json({ success: false, error: "Access denied. Insufficient permissions." }, { status: 403 });
    }

    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const search = url.searchParams.get("search") || "";

    const supabase = await createServerClient();
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) query = query.eq("category", category);
    if (search) query = query.ilike("action", `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    logger.info(`[API:Admin:Audit] Returned ${data?.length || 0} live audit entries.`);
    return NextResponse.json({ success: true, data: { entries: data || [], total: data?.length || 0 } });
  } catch (err) {
    logger.error("[API:Admin:Audit] Internal server error during audit fetch:", err as Record<string, unknown>);
    return NextResponse.json({ success: false, error: "Audit log fetch failed." }, { status: 500 });
  }
}
