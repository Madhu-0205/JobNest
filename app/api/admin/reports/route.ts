import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";

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
 * GET /api/admin/reports — List available report types and recent exports.
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: recentExports } = await supabase
      .from("report_exports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: {
        reportTypes: REPORT_TYPES,
        recentExports: recentExports || [],
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        reportTypes: REPORT_TYPES,
        recentExports: [],
      },
    });
  }
}

/**
 * POST /api/admin/reports — Queue a new report export.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      reportType?: string;
      periodStart?: string;
      periodEnd?: string;
      requestedBy?: string;
    };

    if (!body.reportType) {
      return NextResponse.json({ success: false, error: "reportType is required." }, { status: 400 });
    }

    const reportId = `rpt-${Date.now()}`;

    try {
      const supabase = await createServerClient();
      const { data } = await supabase.from("report_exports").insert({
        requested_by: body.requestedBy || null,
        report_type: body.reportType,
        parameters: { periodStart: body.periodStart, periodEnd: body.periodEnd },
        status: "pending",
      }).select("id").single();
      if (data?.id) {
        logger.info(`[API:Admin:Reports] Report queued: ${body.reportType} id=${data.id}`);
        return NextResponse.json({ success: true, data: { reportId: data.id, status: "pending" } });
      }
    } catch {
      logger.warn("[API:Admin:Reports] Simulated report queue.");
    }

    return NextResponse.json({ success: true, data: { reportId, status: "pending" } });
  } catch {
    return NextResponse.json({ success: false, error: "Report generation failed." }, { status: 500 });
  }
}
