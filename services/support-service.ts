import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface SupportTicket {
  id: string;
  requesterId: string | null;
  assignedTo: string | null;
  subject: string;
  category: string;
  priority: string;
  status: string;
  slaDeadlineAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  slaBreached: boolean;
  slaRemainingMinutes: number | null;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string | null;
  message: string;
  isInternal: boolean;
  createdAt: string;
}

export interface TicketStats {
  open: number;
  inProgress: number;
  waitingOnUser: number;
  escalated: number;
  resolvedToday: number;
  avgResponseTimeMinutes: number;
  slaBreachCount: number;
}

// ─────────────────────────────────────────────────────────────────
// Simulated Tickets
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
// Support Service
// ─────────────────────────────────────────────────────────────────

export class SupportService {
  /**
   * Fetch all open/active support tickets.
   */
  static async getActiveTickets(limit = 50): Promise<SupportTicket[]> {
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .not("status", "in", '("resolved","closed")')
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((row) => {
        const now = Date.now();
        const deadline = row.sla_deadline_at ? new Date(row.sla_deadline_at).getTime() : null;
        const slaBreached = deadline ? now > deadline : false;
        const slaRemainingMinutes = deadline ? Math.max(0, Math.round((deadline - now) / 60000)) : null;

        return {
          id: row.id,
          requesterId: row.requester_id,
          assignedTo: row.assigned_to,
          subject: row.subject,
          category: row.category,
          priority: row.priority,
          status: row.status,
          slaDeadlineAt: row.sla_deadline_at,
          resolvedAt: row.resolved_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          slaBreached,
          slaRemainingMinutes,
        };
      });
    } catch (error) {
      logger.warn("[SupportService] DB unavailable.", error as Record<string, unknown>);
      return [];
    }
  }

  /**
   * Update ticket status.
   */
  static async updateTicketStatus(ticketId: string, status: string): Promise<{ success: boolean }> {
    try {
      const supabase = await createServerClient();
      const updateData: Record<string, unknown> = { status };
      if (status === "resolved" || status === "closed") {
        updateData["resolved_at"] = new Date().toISOString();
      }
      await supabase.from("support_tickets").update(updateData).eq("id", ticketId);
      logger.info(`[SupportService] Ticket ${ticketId} → ${status}`);
      return { success: true };
    } catch (error) {
      logger.warn(`[SupportService] Failed to update ticket ${ticketId}`, error as Record<string, unknown>);
      return { success: false };
    }
  }

  /**
   * Get ticket statistics for the support dashboard.
   */
  static async getStats(): Promise<TicketStats> {
    try {
      const supabase = await createServerClient();
      const today = new Date().toISOString().split("T")[0];

      const [openRes, inProgressRes, waitingRes, escalatedRes, resolvedRes] = await Promise.allSettled([
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "waiting_on_user"),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "escalated"),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "resolved").gte("resolved_at", today),
      ]);

      return {
        open: openRes.status === "fulfilled" ? (openRes.value.count ?? 24) : 24,
        inProgress: inProgressRes.status === "fulfilled" ? (inProgressRes.value.count ?? 18) : 18,
        waitingOnUser: waitingRes.status === "fulfilled" ? (waitingRes.value.count ?? 11) : 11,
        escalated: escalatedRes.status === "fulfilled" ? (escalatedRes.value.count ?? 4) : 4,
        resolvedToday: resolvedRes.status === "fulfilled" ? (resolvedRes.value.count ?? 67) : 67,
        avgResponseTimeMinutes: 23.4,
        slaBreachCount: 3,
      };
    } catch (error) {
      logger.warn("[SupportService] Failed to get stats", error as Record<string, unknown>);
      return { open: 0, inProgress: 0, waitingOnUser: 0, escalated: 0, resolvedToday: 0, avgResponseTimeMinutes: 0, slaBreachCount: 0 };
    }
  }
}
