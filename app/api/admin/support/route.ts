import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/services/logger";
import { SupportService } from "@/services/support-service";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";

/**
 * GET /api/admin/support — Secure Active tickets + stats.
 */
export async function GET() {
  try {
    // 1. Enforce strict permissions authorization check
    try {
      await AuthorizationGuard.assertPermission(PERMISSIONS.SUPPORT_VIEW);
    } catch {
      return NextResponse.json({ success: false, error: "Access denied. Insufficient permissions." }, { status: 403 });
    }

    const [tickets, stats] = await Promise.all([
      SupportService.getActiveTickets(50),
      SupportService.getStats(),
    ]);
    return NextResponse.json({ success: true, data: { tickets, stats } });
  } catch (err) {
    logger.error("[API:Admin:Support] Tickets fetch failed:", err as Record<string, unknown>);
    return NextResponse.json({ success: false, error: "Support tickets fetch failed." }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/support — Securely update support ticket status.
 */
export async function PATCH(req: NextRequest) {
  try {
    // 1. Enforce strict permissions authorization check
    try {
      await AuthorizationGuard.assertPermission(PERMISSIONS.SUPPORT_MANAGE);
    } catch {
      return NextResponse.json({ success: false, error: "Access denied. Insufficient permissions." }, { status: 403 });
    }

    const body = await req.json() as { ticketId?: string; status?: string };
    if (!body.ticketId || !body.status) {
      return NextResponse.json({ success: false, error: "ticketId and status are required." }, { status: 400 });
    }

    const result = await SupportService.updateTicketStatus(body.ticketId, body.status);
    logger.info(`[API:Admin:Support] Ticket ${body.ticketId} updated to status: ${body.status}`);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    logger.error("[API:Admin:Support] Ticket update failed:", err as Record<string, unknown>);
    return NextResponse.json({ success: false, error: "Ticket update failed." }, { status: 500 });
  }
}
