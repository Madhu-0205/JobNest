import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";
import { adminReportSchema } from "@/lib/validation/api-schemas";

const REPORT_TYPES = [
  { type: "daily_summary", label: "Daily Platform Summary", description: "All KPIs for a single day" },
  { type: "weekly_revenue", label: "Weekly Revenue Report", description: "Revenue breakdown, commissions, payouts" },
  { type: "monthly_analytics", label: "Monthly Analytics", description: "DAU, MAU, growth, retention" },
  { type: "worker_growth", label: "Worker Growth Report", description: "New registrations, retention, churn" },
  { type: "employer_growth", label: "Employer Growth Report", description: "Employer acquisition, retention, spend" },
  { type: "fraud_summary", label: "Fraud Summary", description: "Alerts, cases, outcomes, blocked accounts" },
  { type: "trust_scores", label: "Trust Score Distribution", description: "Platform-wide trust score analytics" },
  { type: "opportunity_analytics", label: "Opportunity Analytics", description: "Creation, applications, hire rates, completion" },
  { type: "support_sla", label: "Support SLA Report", description: "Ticket volumes, response times, breaches" },
  { type: "financial_reconciliation", label: "Financial Reconciliation", description: "Wallet balances, escrow, ledger audit" },
];

/**
 * GET /api/admin/reports — Securely list available report types and recent exports.
 */
export async function GET() {
  try {
    // 1. Enforce strict permissions authorization check
    try {
      await AuthorizationGuard.assertPermission(PERMISSIONS.ANALYTICS_VIEW);
    } catch {
      return NextResponse.json({ success: false, error: "Access denied. Insufficient permissions." }, { status: 403 });
    }

    const supabase = await createServerClient();
    const { data: recentExports, error } = await supabase
      .from("report_exports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: {
        reportTypes: REPORT_TYPES,
        recentExports: recentExports || [],
      },
    });
  } catch (err) {
    logger.error("[API:Admin:Reports] List reports failed:", err as Record<string, unknown>);
    return NextResponse.json({ success: false, error: "Reports list fetch failed." }, { status: 500 });
  }
}

/**
 * POST /api/admin/reports — Securely queue a new report export.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Enforce strict permissions authorization check
    let userId: string;
    try {
      userId = await AuthorizationGuard.assertPermission(PERMISSIONS.ANALYTICS_EXPORT);
    } catch {
      return NextResponse.json({ success: false, error: "Access denied. Insufficient permissions." }, { status: 403 });
    }

    const rawBody = await req.json();
    const parseResult = adminReportSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const body = parseResult.data;

    const supabase = await createServerClient();
    const { data, error } = await supabase.from("report_exports").insert({
      requested_by: userId,
      report_type: body.reportType,
      parameters: { periodStart: body.periodStart, periodEnd: body.periodEnd },
      status: "pending",
    }).select("id").single();

    if (error || !data) {
      throw error || new Error("Failed to register report export task.");
    }

    logger.info(`[API:Admin:Reports] Report queued: ${body.reportType} id=${data.id} by user ${userId}`);
    return NextResponse.json({ success: true, data: { reportId: data.id, status: "pending" } });
  } catch (err) {
    logger.error("[API:Admin:Reports] Report generation failed:", err as Record<string, unknown>);
    return NextResponse.json({ success: false, error: "Report generation failed." }, { status: 500 });
  }
}
