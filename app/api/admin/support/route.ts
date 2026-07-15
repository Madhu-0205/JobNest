import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/services/logger";
import { SupportService } from "@/services/support-service";

/**
 * GET /api/admin/support — Active tickets + stats.
 */
export async function GET() {
  try {
    const [tickets, stats] = await Promise.all([
      SupportService.getActiveTickets(50),
      SupportService.getStats(),
    ]);
    return NextResponse.json({ success: true, data: { tickets, stats } });
  } catch {
    return NextResponse.json({ success: true, data: { tickets: [], stats: {} } });
  }
}

/**
 * PATCH /api/admin/support — Update ticket status.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { ticketId?: string; status?: string };
    if (!body.ticketId || !body.status) {
      return NextResponse.json({ success: false, error: "ticketId and status are required." }, { status: 400 });
    }

    const result = await SupportService.updateTicketStatus(body.ticketId, body.status);
    logger.info(`[API:Admin:Support] Ticket ${body.ticketId} → ${body.status}`);
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, error: "Ticket update failed." }, { status: 500 });
  }
}
