import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";
import { EventBus } from "./event-bus";

export interface QueueItem {
  eventType: string;
  payload: Record<string, unknown>;
  clientTimestamp?: string;
}

/**
 * Enterprise Realtime Operations Service.
 * Coordinates database synchronization for messages, tracks, and queue event rollbacks.
 */
export class RealtimeService {
  /**
   * Processes a list of offline client queued messages/events.
   * Resolves conflicts by selecting the latest updates according to client-side timestamp.
   */
  static async processOfflineQueue(
    userId: string,
    queue: QueueItem[]
  ): Promise<{ processed: number; failed: number }> {
    logger.info(`[RealtimeService] Synchronizing offline queue for user: ${userId}. Size: ${queue.length}`);
    
    let processed = 0;
    let failed = 0;

    // Sort queue items by timestamp to ensure chronological database inserts
    const sortedQueue = [...queue].sort((a, b) => {
      const timeA = a.clientTimestamp ? new Date(a.clientTimestamp).getTime() : 0;
      const timeB = b.clientTimestamp ? new Date(b.clientTimestamp).getTime() : 0;
      return timeA - timeB;
    });

    for (const item of sortedQueue) {
      try {
        const supabase = await createServerClient();

        if (item.eventType === "chat.message.sent") {
          // Sync chat message
          const { error } = await supabase.from("chat_messages").insert({
            room_id: item.payload["roomId"] as string,
            sender_id: userId,
            message_type: (item.payload["messageType"] as string) || "text",
            content: (item.payload["content"] as string) || null,
            attachment_url: (item.payload["attachmentUrl"] as string) || null,
            location_lat: (item.payload["locationLat"] as number) || null,
            location_lon: (item.payload["locationLon"] as number) || null,
            delivery_status: "sent",
            created_at: item.clientTimestamp || new Date().toISOString(),
          });

          if (error) throw error;
          
          // Publish to Event Bus
          await EventBus.publish("chat.message.sent", {
            roomId: item.payload["roomId"],
            senderId: userId,
            messageType: item.payload["messageType"],
          }, userId);
          
        } else if (item.eventType === "worker.location.updated") {
          // Sync tracking coordinate
          const { error } = await supabase.from("live_tracking").upsert({
            user_id: userId,
            latitude: item.payload["latitude"] as number,
            longitude: item.payload["longitude"] as number,
            speed: (item.payload["speed"] as number) || null,
            heading: (item.payload["heading"] as number) || null,
            accuracy: (item.payload["accuracy"] as number) || null,
            status: (item.payload["status"] as string) || "available",
            updated_at: item.clientTimestamp || new Date().toISOString(),
            last_seen: item.clientTimestamp || new Date().toISOString(),
          });

          if (error) throw error;

          // Publish to Event Bus
          await EventBus.publish("worker.location.updated", {
            latitude: item.payload["latitude"],
            longitude: item.payload["longitude"],
            speed: item.payload["speed"],
          }, userId);
        }

        // Record entry to events queue in DB as processed
        try {
          await supabase.from("realtime_events_queue").insert({
            user_id: userId,
            event_type: item.eventType,
            payload: item.payload,
            status: "processed",
            client_timestamp: item.clientTimestamp || new Date().toISOString(),
          });
        } catch {
          // Ignore secondary database recording failures
        }

        processed++;
      } catch (err) {
        logger.error(`[RealtimeService] Sync failed for event type [${item.eventType}]`, err);
        failed++;

        // Record entry in DB as failed
        try {
          const supabase = await createServerClient();
          await supabase.from("realtime_events_queue").insert({
            user_id: userId,
            event_type: item.eventType,
            payload: item.payload,
            status: "failed",
            error_message: err instanceof Error ? err.message : "Unknown synchronization error",
            client_timestamp: item.clientTimestamp || new Date().toISOString(),
          });
        } catch {
          // Ignore secondary database logging failures
        }
      }
    }

    return { processed, failed };
  }
}
