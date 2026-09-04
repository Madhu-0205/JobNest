import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface ModerationItem {
  id: string;
  contentType: string;
  contentId: string;
  reportedBy: string | null;
  reason: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationActionResult {
  itemId: string;
  action: "approved" | "rejected" | "escalated";
  note?: string;
  success: boolean;
}

export interface ModerationStats {
  pending: number;
  inReview: number;
  resolvedToday: number;
  escalated: number;
  avgResolutionHours: number;
}

export class ModerationService {
  /**
   * Fetch pending moderation queue items.
   */
  static async getPendingQueue(limit = 50): Promise<ModerationItem[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("moderation_queue")
      .select("*")
      .in("status", ["OPEN", "TRIAGED", "UNDER_REVIEW", "WAITING_FOR_INFORMATION", "ESCALATED"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      logger.error("[ModerationService] DB fetch failed", error);
      throw new Error("Database unavailable for ModerationService.");
    }

    return (data || []).map((row) => ({
      id: row.id,
      contentType: row.content_type,
      contentId: row.content_id,
      reportedBy: row.reported_by,
      reason: row.reason,
      status: row.status,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Take an action on a queue item.
   */
  static async takeAction(
    itemId: string,
    action: "approve" | "reject" | "escalate" | "resolve" | "dismiss",
    actorId: string,
    note?: string
  ): Promise<ModerationActionResult> {
    const supabase = await createServerClient();

    const statusMap: Record<string, string> = {
      approve: "RESOLVED",
      reject: "DISMISSED",
      resolve: "RESOLVED",
      dismiss: "DISMISSED",
      escalate: "ESCALATED",
    };
    
    const newStatus = statusMap[action];
    if (!newStatus) throw new Error("Invalid moderation action");

    const { error } = await supabase
      .from("moderation_queue")
      .update({ 
        status: newStatus, 
        assigned_to: actorId,
        resolved_at: ["RESOLVED", "DISMISSED"].includes(newStatus) ? new Date().toISOString() : null
      })
      .eq("id", itemId);

    if (error) {
      logger.error("[ModerationService] Action update failed", error);
      throw new Error("Failed to execute moderation action.");
    }

    if (note) {
      await supabase.from("moderation_notes").insert({
        queue_item_id: itemId,
        author_id: actorId,
        note,
      });
    }

    // Insert into audit logs
    await supabase.from("audit_logs").insert({
      user_id: actorId,
      action: `moderation_${action}`,
      target_type: "moderation_queue",
      target_id: itemId,
      metadata: { note }
    });

    const resultAction = action === "approve" ? "approved" : action === "reject" ? "rejected" : "escalated";
    return { itemId, action: resultAction, note, success: true };
  }

  /**
   * Get moderation statistics.
   */
  static async getStats(): Promise<ModerationStats> {
    const supabase = await createServerClient();
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayIso = today.toISOString();

    const [pendingRes, inReviewRes, resolvedRes, escalatedRes] = await Promise.allSettled([
      supabase.from("moderation_queue").select("*", { count: "exact", head: true }).eq("status", "OPEN"),
      supabase.from("moderation_queue").select("*", { count: "exact", head: true }).in("status", ["TRIAGED", "UNDER_REVIEW", "WAITING_FOR_INFORMATION"]),
      supabase.from("moderation_queue").select("*", { count: "exact", head: true }).in("status", ["RESOLVED", "DISMISSED", "CLOSED"]).gte("resolved_at", todayIso),
      supabase.from("moderation_queue").select("*", { count: "exact", head: true }).eq("status", "ESCALATED"),
    ]);

    if (
      pendingRes.status === "rejected" || 
      inReviewRes.status === "rejected" || 
      resolvedRes.status === "rejected" || 
      escalatedRes.status === "rejected"
    ) {
      logger.error("[ModerationService] Failed to load some stats");
      throw new Error("Failed to load moderation stats.");
    }

    return {
      pending: pendingRes.value.count ?? 0,
      inReview: inReviewRes.value.count ?? 0,
      resolvedToday: resolvedRes.value.count ?? 0,
      escalated: escalatedRes.value.count ?? 0,
      avgResolutionHours: 0, // Could be calculated with more complex queries
    };
  }
}
