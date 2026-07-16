import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/services/logger";
import { ModerationService } from "@/services/moderation-service";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";

/**
 * GET /api/admin/moderation — Secure Queue + stats.
 */
export async function GET() {
  try {
    // 1. Enforce strict permissions authorization check
    try {
      await AuthorizationGuard.assertPermission(PERMISSIONS.MODERATION_VIEW);
    } catch {
      return NextResponse.json({ success: false, error: "Access denied. Insufficient permissions." }, { status: 403 });
    }

    const [items, stats] = await Promise.all([
      ModerationService.getPendingQueue(50),
      ModerationService.getStats(),
    ]);
    return NextResponse.json({ success: true, data: { items, stats } });
  } catch (err) {
    logger.error("[API:Admin:Moderation] Queue fetch failed:", err as Record<string, unknown>);
    return NextResponse.json({ success: false, error: "Moderation queue fetch failed." }, { status: 500 });
  }
}

/**
 * POST /api/admin/moderation — Securely take action on a queue item.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Enforce strict permissions authorization check
    let userId: string;
    try {
      userId = await AuthorizationGuard.assertPermission(PERMISSIONS.MODERATION_ACTION);
    } catch {
      return NextResponse.json({ success: false, error: "Access denied. Insufficient permissions." }, { status: 403 });
    }

    const body = await req.json() as { itemId?: string; action?: "approved" | "rejected" | "escalated"; note?: string };
    if (!body.itemId || !body.action) {
      return NextResponse.json({ success: false, error: "itemId and action are required." }, { status: 400 });
    }

    const result = await ModerationService.takeAction(
      body.itemId,
      body.action,
      userId, // Use authenticated actor's userId
      body.note
    );

    logger.info(`[API:Admin:Moderation] Action ${body.action} executed on item ${body.itemId} by moderator ${userId}`);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    logger.error("[API:Admin:Moderation] Action failed:", err as Record<string, unknown>);
    return NextResponse.json({ success: false, error: "Moderation action failed." }, { status: 500 });
  }
}
