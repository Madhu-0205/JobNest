import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";

export type EventType =
  | "identity.user.updated"
  | "opportunity.created"
  | "opportunity.updated"
  | "application.created"
  | "application.shortlisted"
  | "application.accepted"
  | "worker.location.updated"
  | "worker.arrived"
  | "job.started"
  | "job.completed"
  | "review.created"
  | "notification.created"
  | "chat.message.sent"
  | "chat.message.read";

export type EventHandler = (payload: Record<string, unknown>, userId?: string) => void | Promise<void>;

/**
 * Enterprise Event Bus.
 * De-couples backend operations via real-time event broadcasting and logging.
 */
export class EventBus {
  private static subscribers: Map<string, Set<EventHandler>> = new Map();

  /**
   * Subscribes a handler callback to a specific event type, or "*" for all events.
   */
  static subscribe(eventType: EventType | "*", handler: EventHandler): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);
    
    return () => {
      this.subscribers.get(eventType)?.delete(handler);
    };
  }

  /**
   * Publishes an event to subscribers and logs audit tracking in the database.
   */
  static async publish(eventType: EventType, payload: Record<string, unknown>, userId?: string): Promise<void> {
    logger.info(`[EventBus] Event Published: ${eventType}`, { userId, payload });

    // 1. Dispatch to specific event handlers
    const specificHandlers = this.subscribers.get(eventType);
    if (specificHandlers) {
      for (const handler of specificHandlers) {
        try {
          await handler(payload, userId);
        } catch (err) {
          logger.error(`[EventBus] Handler error for ${eventType}`, err);
        }
      }
    }

    // 2. Dispatch to wildcard handlers
    const wildcardHandlers = this.subscribers.get("*");
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          await handler(payload, userId);
        } catch (err) {
          logger.error(`[EventBus] Wildcard handler error for ${eventType}`, err);
        }
      }
    }

    // 3. Log to DB (Dual Mode check)
    try {
      const supabase = await createServerClient();
      const { error } = await supabase.from("realtime_audit_logs").insert({
        user_id: userId || null,
        event_type: eventType,
        payload,
      });

      if (error) {
        logger.warn(`[EventBus] DB audit insertion warning: ${error.message}`);
      }
    } catch {
      logger.info(`[EventBus] Database unconfigured or offline. Bypassing persistent audit logging for [${eventType}].`);
    }
  }
}
