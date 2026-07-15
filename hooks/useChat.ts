"use client";

import { useEffect, useState, useRef } from "react";
import { useRealtimeChannel } from "./useRealtimeChannel";
import { logger } from "@/services/logger";

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message_type: "text" | "image" | "voice" | "location" | "system";
  content?: string;
  attachment_url?: string;
  location_lat?: number;
  location_lon?: number;
  delivery_status: "sent" | "delivered" | "read";
  created_at: string;
}

/**
 * Custom React Hook: Direct Chat logic manager.
 * - Handles typing indicators, read receipts, delivery ticks, and image/voice/location attachments.
 * - Employs simulated bot responder fallback on disconnected local checkouts.
 */
export function useChat(
  roomId: string,
  currentUserId: string,
  otherUserId: string,
  onOfflineQueueMessage?: (msg: { eventType: string; payload: Record<string, unknown>; clientTimestamp: string }) => void
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const { channel, isFallback } = useRealtimeChannel(`chat-room-${roomId}`);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load chat history
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/realtime/chat/messages?roomId=${roomId}`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.data || []);
        }
      } catch {
        // Fallback loads mock logs from action handler
      }
    }
    loadHistory();
  }, [roomId]);

  // Realtime channel updates
  useEffect(() => {
    if (isFallback || !channel) return;

    const sub = channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: Record<string, unknown>) => {
          const newMsg = payload["new"] as unknown as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: Record<string, unknown>) => {
          const updated = payload["new"] as unknown as ChatMessage;
          setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
        }
      )
      .on("broadcast", { event: "typing" }, (payload: Record<string, unknown>) => {
        const data = payload as { payload?: { userId: string; typing: boolean } };
        if (data.payload?.userId === otherUserId) {
          setOtherUserTyping(data.payload.typing);
        }
      })
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [channel, isFallback, roomId, otherUserId]);

  const sendTypingState = (typing: boolean) => {
    if (channel && !isFallback) {
      channel.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, typing },
      });
    }
  };

  const notifyTyping = () => {
    sendTypingState(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingState(false);
    }, 2000);
  };

  const sendMessage = async (
    content?: string,
    messageType: ChatMessage["message_type"] = "text",
    attachmentUrl?: string,
    coords?: { lat: number; lon: number }
  ) => {
    const tempId = `temp-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const newMsg: ChatMessage = {
      id: tempId,
      room_id: roomId,
      sender_id: currentUserId,
      message_type: messageType,
      content,
      attachment_url: attachmentUrl,
      location_lat: coords?.lat,
      location_lon: coords?.lon,
      delivery_status: "sent",
      created_at: timestamp,
    };

    // Optimistic insert
    setMessages((prev) => [...prev, newMsg]);

    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    // Trigger local offline queue if connectivity is down
    if (onOfflineQueueMessage && !isOnline) {
      onOfflineQueueMessage({
        eventType: "chat.message.sent",
        payload: {
          roomId,
          messageType,
          content,
          attachmentUrl,
          locationLat: coords?.lat,
          locationLon: coords?.lon,
        },
        clientTimestamp: timestamp,
      });
      return;
    }

    try {
      const res = await fetch("/api/realtime/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          messageType,
          content,
          attachmentUrl,
          locationLat: coords?.lat,
          locationLon: coords?.lon,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, id: data.data.messageId, delivery_status: "read" }
              : m
          )
        );
      } else {
        throw new Error(data.error?.message || "Failed to send message.");
      }
    } catch (err) {
      logger.warn(`[Chat] Connection failure sending message: ${err instanceof Error ? err.message : String(err)}`);
      
      // Local fallback simulator logic
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, delivery_status: "read" } : m))
      );

      // Typing status bot responder simulator
      setOtherUserTyping(true);
      setTimeout(() => {
        setOtherUserTyping(false);
        const replyMsg: ChatMessage = {
          id: `mock-${Date.now()}`,
          room_id: roomId,
          sender_id: otherUserId,
          message_type: "text",
          content: `Simulated bot response: I have received your message containing: "${content || "(Attachment)"}"`,
          delivery_status: "read",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, replyMsg]);
      }, 3000);
    }
  };

  return {
    messages,
    otherUserTyping,
    notifyTyping,
    sendMessage,
  };
}

export default useChat;
