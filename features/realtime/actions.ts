"use server";

import { createServerClient } from "@/lib/supabase/server";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";
import { RealtimeService, QueueItem } from "@/services/realtime-service";
import { EventBus } from "@/services/event-bus";
import {
  sendMessageSchema,
  liveTrackingSchema,
  syncOfflineQueueSchema
} from "./schemas";
import { z } from "zod";
import { runWithRequestContext } from "@/lib/observability/request-context-helper";
import { logRequestLifecycle } from "@/lib/observability/request-logger";
import { ActionResult } from "@/features/auth/actions";

async function executeAction<T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  return runWithRequestContext(async () => {
    return logRequestLifecycle(actionName, async (): Promise<ActionResult<T>> => {
      try {
        const data = await fn();
        return { success: true, data };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const details = error.flatten().fieldErrors;
          return {
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: "Input validation failed.",
              details,
            },
          };
        }

        return {
          success: false,
          error: {
            code: error instanceof Error ? error.name : "UNKNOWN_ERROR",
            message: error instanceof Error ? error.message : "An unexpected failure occurred.",
          },
        };
      }
    });
  });
}

/**
 * Server Action: Creates or retrieves a direct chat room between worker and employer.
 */
export async function createChatRoomAction(
  opportunityId: string | null,
  employerId: string,
  workerId: string
): Promise<ActionResult<{ roomId: string }>> {
  return executeAction("createChatRoomAction", async () => {
    const callerId = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_VIEW);
    
    // BOLA Check: verify participant identity
    if (callerId !== employerId && callerId !== workerId) {
      throw new Error("Access denied. You are not a participant in this conversation.");
    }

    const supabase = await createServerClient();
    
    // Try to find existing chat room
    let query = supabase
      .from("chat_rooms")
      .select("id")
      .eq("employer_id", employerId)
      .eq("worker_id", workerId);
      
    if (opportunityId) {
      query = query.eq("opportunity_id", opportunityId);
    } else {
      query = query.is("opportunity_id", null);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return { roomId: existing.id };
    }

    // Create new chat room
    const { data: newRoom, error: insertErr } = await supabase
      .from("chat_rooms")
      .insert({
        opportunity_id: opportunityId,
        employer_id: employerId,
        worker_id: workerId,
      })
      .select("id")
      .single();

    if (insertErr || !newRoom) {
      throw new Error(insertErr?.message || "Failed to create chat room.");
    }

    return { roomId: newRoom.id };
  });
}

/**
 * Server Action: Persists a chat message into the database.
 */
export async function sendMessageAction(formData: unknown): Promise<ActionResult<{ messageId: string }>> {
  return executeAction("sendMessageAction", async () => {
    const validated = sendMessageSchema.parse(formData);
    const user = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_VIEW);
    const supabase = await createServerClient();

    // BOLA Check: Verify user is a participant of the room
    const { data: room, error: roomErr } = await supabase
      .from("chat_rooms")
      .select("employer_id, worker_id")
      .eq("id", validated.roomId)
      .single();

    if (roomErr || !room || (room.employer_id !== user && room.worker_id !== user)) {
      throw new Error("Access denied. You are not a participant in this chat room.");
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        room_id: validated.roomId,
        sender_id: user,
        message_type: validated.messageType,
        content: validated.content || null,
        attachment_url: validated.attachmentUrl || null,
        location_lat: validated.locationLat || null,
        location_lon: validated.locationLon || null,
        delivery_status: "sent",
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to insert chat message.");
    }

    // Publish to Event Bus
    await EventBus.publish("chat.message.sent", {
      roomId: validated.roomId,
      senderId: user,
      messageType: validated.messageType,
    }, user);

    return { messageId: data.id };
  });
}

/**
 * Server Action: Fetches all active chat rooms for the authenticated profile.
 */
export async function getChatRoomsAction(): Promise<ActionResult<Record<string, unknown>[]>> {
  return executeAction("getChatRoomsAction", async () => {
    const user = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_VIEW);
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("chat_rooms")
      .select(`
        id,
        created_at,
        opportunity_id,
        employer_id,
        worker_id,
        metadata
      `)
      .or(`employer_id.eq.${user},worker_id.eq.${user}`);

    if (error) throw error;
    return data || [];
  });
}

/**
 * Server Action: Retrieves chat message logs for a specified room.
 */
export async function getChatMessagesAction(
  roomId: string,
  limit = 50,
  beforeTimestamp?: string
): Promise<ActionResult<Record<string, unknown>[]>> {
  return executeAction("getChatMessagesAction", async () => {
    const user = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_VIEW);
    const supabase = await createServerClient();

    // BOLA Check: Verify user is a participant of the room
    const { data: room, error: roomErr } = await supabase
      .from("chat_rooms")
      .select("employer_id, worker_id")
      .eq("id", roomId)
      .single();

    if (roomErr || !room || (room.employer_id !== user && room.worker_id !== user)) {
      throw new Error("Access denied. You are not a participant in this chat room.");
    }

    let query = supabase
      .from("chat_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (beforeTimestamp) {
      query = query.lt("created_at", beforeTimestamp);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  });
}

/**
 * Server Action: Upserts worker live coordinates tracking status.
 */
export async function updateLiveTrackingAction(formData: unknown): Promise<ActionResult<{ userId: string }>> {
  return executeAction("updateLiveTrackingAction", async () => {
    const validated = liveTrackingSchema.parse(formData);
    const user = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_VIEW);
    const supabase = await createServerClient();

    const { error } = await supabase.from("live_tracking").upsert({
      user_id: user,
      latitude: validated.latitude,
      longitude: validated.longitude,
      speed: validated.speed || null,
      heading: validated.heading || null,
      accuracy: validated.accuracy || null,
      status: validated.status || "available",
      updated_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
    });

    if (error) throw error;

    // Publish update to event bus
    await EventBus.publish("worker.location.updated", {
      latitude: validated.latitude,
      longitude: validated.longitude,
      speed: validated.speed || 0,
      heading: validated.heading || 0,
    }, user);

    return { userId: user };
  });
}

/**
 * Server Action: Retrieves the current live tracking details of a worker.
 */
export async function getLiveTrackingAction(userId: string): Promise<ActionResult<Record<string, unknown>>> {
  return executeAction("getLiveTrackingAction", async () => {
    const callerId = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_VIEW);
    const supabase = await createServerClient();

    if (callerId !== userId) {
      // BOLA check: caller must have an active application/job relationship with the worker
      const { data: relationship, error: relErr } = await supabase
        .from("applications")
        .select(`
          status,
          opportunities (employer_id)
        `)
        .eq("user_id", userId)
        .eq("status", "accepted")
        .maybeSingle();

      const relData = relationship as { opportunities: { employer_id: string } | null } | null;
      const employerId = relData?.opportunities?.employer_id;
      if (relErr || !employerId || employerId !== callerId) {
        throw new Error("Access denied. You do not have an active hiring relationship with this worker.");
      }
    }

    const { data, error } = await supabase
      .from("live_tracking")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) throw error || new Error("Live tracking telemetry not found for this worker.");
    return data;
  });
}

/**
 * Server Action: Bulk synchronizes client-side offline queued mutations.
 */
export async function syncOfflineQueueAction(formData: unknown): Promise<ActionResult<{ processed: number; failed: number }>> {
  return executeAction("syncOfflineQueueAction", async () => {
    const validated = syncOfflineQueueSchema.parse(formData);
    const user = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_VIEW);
    
    const queueItems: QueueItem[] = validated.map(item => ({
      eventType: item.eventType,
      payload: item.payload,
      clientTimestamp: item.clientTimestamp,
    }));

    const syncResult = await RealtimeService.processOfflineQueue(user, queueItems);
    return syncResult;
  });
}
