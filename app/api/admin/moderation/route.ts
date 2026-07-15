import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/services/logger";
import { ModerationService } from "@/services/moderation-service";

/**
 * GET /api/admin/moderation — Queue + stats.
 */
export async function GET() {
  try {
    const [items, stats] = await Promise.all([
      ModerationService.getPendingQueue(50),
      ModerationService.getStats(),
    ]);
    return NextResponse.json({ success: true, data: { items, stats } });
  } catch {
    return NextResponse.json({ success: true, data: { items: [], stats: { pending: 0, inReview: 0, resolvedToday: 0, escalated: 0, avgResolutionHours: 0 } } });
  }
}

/**
 * POST /api/admin/moderation — Take action on a queue item.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { itemId?: string; action?: "approved" | "rejected" | "escalated"; note?: string; actorId?: string };
    if (!body.itemId || !body.action) {
      return NextResponse.json({ success: false, error: "itemId and action are required." }, { status: 400 });
    }

    const result = await ModerationService.takeAction(
      body.itemId,
      body.action,
      body.actorId || "system",
      body.note
    );

    logger.info(`[API:Admin:Moderation] ${body.action} on ${body.itemId}`);
    return NextResponse.json({ success: true, data: result });
  } catch {
    return NextResponse.json({ success: false, error: "Moderation action failed." }, { status: 500 });
  }
}
