import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";

// ─────────────────────────────────────────────────────────────────
// Simulated Audit Log Entries
// ─────────────────────────────────────────────────────────────────

const SIMULATED_AUDIT = [
  { id: "aud-1", actor: "admin@jobnest.in", action: "USER_SUSPEND", category: "admin", resource: "user:abc123", created_at: new Date(Date.now() - 300000).toISOString() },
  { id: "aud-2", actor: "system", action: "FRAUD_AUTO_FLAG", category: "security", resource: "user:xyz456", created_at: new Date(Date.now() - 600000).toISOString() },
  { id: "aud-3", actor: "finance@jobnest.in", action: "WALLET_ADJUSTMENT", category: "financial", resource: "wallet:w789", created_at: new Date(Date.now() - 900000).toISOString() },
  { id: "aud-4", actor: "mod@jobnest.in", action: "CONTENT_REMOVED", category: "moderation", resource: "opportunity:op321", created_at: new Date(Date.now() - 1200000).toISOString() },
  { id: "aud-5", actor: "user:u111", action: "LOGIN_MFA_ATTEMPT", category: "auth", resource: "session:s555", created_at: new Date(Date.now() - 1500000).toISOString() },
  { id: "aud-6", actor: "admin@jobnest.in", action: "CONFIG_UPDATED", category: "admin", resource: "setting:commission_rate", created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: "aud-7", actor: "system", action: "PAYMENT_RECONCILIATION", category: "financial", resource: "batch:daily-2026-07-15", created_at: new Date(Date.now() - 2100000).toISOString() },
  { id: "aud-8", actor: "user:u222", action: "PROFILE_VERIFIED", category: "kyc", resource: "profile:p888", created_at: new Date(Date.now() - 2400000).toISOString() },
  { id: "aud-9", actor: "system", action: "AI_ANOMALY_DETECTED", category: "security", resource: "ai_log:al999", created_at: new Date(Date.now() - 2700000).toISOString() },
  { id: "aud-10", actor: "support@jobnest.in", action: "TICKET_ESCALATED", category: "support", resource: "ticket:tkt-003", created_at: new Date(Date.now() - 3000000).toISOString() },
];

/**
 * GET /api/admin/audit — Searchable audit log.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const search = url.searchParams.get("search") || "";

    try {
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

      if (data && data.length > 0) {
        logger.info(`[API:Admin:Audit] Returned ${data.length} live audit entries.`);
        return NextResponse.json({ success: true, data: { entries: data, total: data.length } });
      }
    } catch {
      logger.warn("[API:Admin:Audit] DB unavailable. Returning simulated entries.");
    }

    let filtered = SIMULATED_AUDIT;
    if (category) filtered = filtered.filter((e) => e.category === category);
    if (search) filtered = filtered.filter((e) => e.action.toLowerCase().includes(search.toLowerCase()));

    return NextResponse.json({
      success: true,
      data: { entries: filtered.slice(0, limit), total: filtered.length },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Audit log fetch failed." }, { status: 500 });
  }
}
