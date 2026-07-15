import { z } from "zod";

export const sendMessageSchema = z.object({
  roomId: z.string().uuid("Room ID must be a valid UUID."),
  messageType: z.enum(["text", "image", "voice", "location", "system"]).default("text"),
  content: z.string().optional(),
  attachmentUrl: z.string().optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLon: z.number().min(-180).max(180).optional(),
}).refine(data => {
  if (data.messageType === "text" && !data.content?.trim()) return false;
  if (data.messageType === "location" && (data.locationLat === undefined || data.locationLon === undefined)) return false;
  if ((data.messageType === "image" || data.messageType === "voice") && !data.attachmentUrl) return false;
  return true;
}, {
  message: "Message contents are incomplete or invalid for the specified message type.",
  path: ["content"],
});

export const presenceUpdateSchema = z.object({
  status: z.enum(["online", "offline", "busy", "working", "available", "invisible"]).default("online"),
});

export const liveTrackingSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().min(0).optional(),
  status: z.string().optional().default("available"),
});

export const queueEventSchema = z.object({
  eventType: z.string().min(1, "Event type is required."),
  payload: z.record(z.string(), z.unknown()),
  clientTimestamp: z.string().optional(),
});

export const syncOfflineQueueSchema = z.array(
  z.object({
    eventType: z.string().min(1, "Event type is required."),
    payload: z.record(z.string(), z.unknown()),
    clientTimestamp: z.string().optional(),
  })
);
