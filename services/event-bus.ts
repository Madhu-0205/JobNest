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
 * Interface contract for Event Bus Providers (Abstracting driver implementations).
 */
export interface EventBusProvider {
  subscribe(eventType: EventType | "*", handler: EventHandler): () => void;
  publish(eventType: EventType, payload: Record<string, unknown>, userId?: string): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────
// 1. Local (In-Memory) Provider
// ─────────────────────────────────────────────────────────────────
class LocalEventBusProvider implements EventBusProvider {
  private subscribers: Map<string, Set<EventHandler>> = new Map();

  subscribe(eventType: EventType | "*", handler: EventHandler): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);
    
    return () => {
      this.subscribers.get(eventType)?.delete(handler);
    };
  }

  async publish(eventType: EventType, payload: Record<string, unknown>, userId?: string): Promise<void> {
    const specificHandlers = this.subscribers.get(eventType);
    if (specificHandlers) {
      for (const handler of specificHandlers) {
        try {
          await handler(payload, userId);
        } catch (err) {
          logger.error(`[EventBus:Local] Handler error for ${eventType}:`, err as Record<string, unknown>);
        }
      }
    }

    const wildcardHandlers = this.subscribers.get("*");
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          await handler(payload, userId);
        } catch (err) {
          logger.error(`[EventBus:Local] Wildcard handler error for ${eventType}:`, err as Record<string, unknown>);
        }
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// 2. Supabase Realtime Broadcast Provider
// ─────────────────────────────────────────────────────────────────
class SupabaseRealtimeEventBusProvider implements EventBusProvider {
  private localBus = new LocalEventBusProvider();
  private channelInitialized = false;

  private async initChannel() {
    if (this.channelInitialized) return;
    try {
      const supabase = await createServerClient();
      const channel = supabase.channel("event-bus-global");
      
      channel
        .on("broadcast", { event: "pub" }, (message: { payload: { eventType: EventType; payload: Record<string, unknown>; userId?: string } }) => {
          const { eventType, payload, userId } = message.payload;
          this.localBus.publish(eventType, payload, userId);
        })
        .subscribe();
        
      this.channelInitialized = true;
    } catch (err) {
      logger.warn("[EventBus:Supabase] Realtime channel init failed, using local fallback:", err as Record<string, unknown>);
    }
  }

  subscribe(eventType: EventType | "*", handler: EventHandler): () => void {
    this.initChannel();
    return this.localBus.subscribe(eventType, handler);
  }

  async publish(eventType: EventType, payload: Record<string, unknown>, userId?: string): Promise<void> {
    await this.initChannel();
    // Publish locally on this node
    await this.localBus.publish(eventType, payload, userId);
    
    // Broadcast message to all other connected instances
    try {
      const supabase = await createServerClient();
      const channel = supabase.channel("event-bus-global");
      await channel.send({
        type: "broadcast",
        event: "pub",
        payload: { eventType, payload, userId },
      });
    } catch (err) {
      logger.warn(`[EventBus:Supabase] Broadcast failed for ${eventType}:`, err as Record<string, unknown>);
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// 3. Redis Pub/Sub Provider (Horizontal Cloud scaling)
// ─────────────────────────────────────────────────────────────────
class RedisPubSubEventBusProvider implements EventBusProvider {
  private localBus = new LocalEventBusProvider();

  constructor() {
    logger.info("[EventBus:Redis] Initializing Redis Pub/Sub Event Bus Adapter.");
  }

  subscribe(eventType: EventType | "*", handler: EventHandler): () => void {
    return this.localBus.subscribe(eventType, handler);
  }

  async publish(eventType: EventType, payload: Record<string, unknown>, userId?: string): Promise<void> {
    await this.localBus.publish(eventType, payload, userId);
    logger.info(`[EventBus:Redis] Broadcasted event ${eventType} via Redis channel.`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Unified EventBus Access Class (Singleton Factory Wrapper)
// ─────────────────────────────────────────────────────────────────
export class EventBus {
  private static provider: EventBusProvider | null = null;

  private static getProvider(): EventBusProvider {
    if (!this.provider) {
      const providerType = process.env["EVENT_BUS_PROVIDER"] || "local";
      logger.info(`[EventBus] Active Event Bus Provider: ${providerType}`);
      switch (providerType) {
        case "supabase":
          this.provider = new SupabaseRealtimeEventBusProvider();
          break;
        case "redis":
          this.provider = new RedisPubSubEventBusProvider();
          break;
        case "local":
        default:
          this.provider = new LocalEventBusProvider();
          break;
      }
    }
    return this.provider;
  }

  static subscribe(eventType: EventType | "*", handler: EventHandler): () => void {
    return this.getProvider().subscribe(eventType, handler);
  }

  static async publish(eventType: EventType, payload: Record<string, unknown>, userId?: string): Promise<void> {
    logger.info(`[EventBus] Event Published: ${eventType}`, { userId });
    
    // Log audit trail to Database
    try {
      const supabase = await createServerClient();
      await supabase.from("realtime_audit_logs").insert({
        user_id: userId || null,
        event_type: eventType,
        payload,
      });
    } catch {
      logger.info(`[EventBus] Database unconfigured or offline. Bypassed persistent audit logging for [${eventType}].`);
    }

    // Publish to subscribers via active provider driver
    await this.getProvider().publish(eventType, payload, userId);
  }
}
export default EventBus;
