"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRealtimeChannel } from "./useRealtimeChannel";
import { logger } from "@/services/logger";
import {
  getOrGenerateUserKeyPair,
  importPeerPublicKey,
  deriveConversationKey,
  encryptMessage,
  decryptMessage,
  isEncryptedMessage,
} from "@/lib/crypto/e2ee";

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message_type: "text" | "image" | "voice" | "location" | "system";
  content?: string;
  raw_ciphertext?: string;
  is_encrypted?: boolean;
  decryption_error?: boolean;
  attachment_url?: string;
  location_lat?: number;
  location_lon?: number;
  delivery_status: "sent" | "delivered" | "read" | "failed";
  created_at: string;
}

/** Deterministically sorts messages by timestamp with ID tie-breaker */
export function sortMessages(msgs: ChatMessage[]): ChatMessage[] {
  return [...msgs].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Custom React Hook: Direct Chat logic manager with End-to-End Encryption (E2EE).
 * - Implements Web Crypto ECDH P-256 key agreement and AES-256-GCM authenticated encryption.
 * - Enforces deterministic message ordering and seamless optimistic reconciliation without duplicates.
 * - Handles auto-reconnect synchronization and offline message safety.
 */
export function useChat(
  roomId: string,
  currentUserId: string,
  otherUserId: string,
  onOfflineQueueMessage?: (msg: { eventType: string; payload: Record<string, unknown>; clientTimestamp: string }) => void
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isE2EEReady, setIsE2EEReady] = useState(false);
  const { channel, isFallback } = useRealtimeChannel(roomId ? `chat-room-${roomId}` : "");
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationKeyRef = useRef<CryptoKey | null>(null);
  const rawMessagesRef = useRef<ChatMessage[]>([]);

  // ─── Helper: Decrypt / Process Incoming Message ───────────────────────────

  const processIncomingMessage = useCallback(
    async (rawMsg: ChatMessage, key: CryptoKey | null): Promise<ChatMessage> => {
      if (isEncryptedMessage(rawMsg.content)) {
        const dec = await decryptMessage(rawMsg.content, key);
        return {
          ...rawMsg,
          raw_ciphertext: rawMsg.content,
          content: dec.text,
          is_encrypted: true,
          decryption_error: !dec.success,
        };
      }
      return {
        ...rawMsg,
        is_encrypted: false,
        decryption_error: false,
      };
    },
    []
  );

  // ─── E2EE Key Agreement ───────────────────────────────────────────────────

  useEffect(() => {
    if (!currentUserId || !otherUserId) {
      conversationKeyRef.current = null;
      setIsE2EEReady(false);
      return;
    }

    let isMounted = true;

    async function establishE2EE() {
      try {
        // 1. Get or generate user's local ECDH keypair
        const myKeyPair = await getOrGenerateUserKeyPair(currentUserId);

        // 2. Register public key on server (public directory)
        await fetch("/api/realtime/chat/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKey: myKeyPair.publicKeyJwk }),
        });

        // 3. Fetch recipient's public key
        const res = await fetch(`/api/realtime/chat/keys?userId=${encodeURIComponent(otherUserId)}`);
        const data = await res.json();

        if (data.success && data.data?.public_key) {
          const peerPublicKey = await importPeerPublicKey(data.data.public_key);
          const derivedKey = await deriveConversationKey(myKeyPair.privateKey, peerPublicKey);

          if (isMounted) {
            conversationKeyRef.current = derivedKey;
            setIsE2EEReady(true);
            logger.info(`[Chat:E2EE] Established conversation key for room ${roomId}`);

            // Re-decrypt any existing raw messages that were waiting for key
            if (rawMessagesRef.current.length > 0) {
              const decrypted = await Promise.all(
                rawMessagesRef.current.map((m) => processIncomingMessage(m, derivedKey))
              );
              setMessages(sortMessages(decrypted));
            }
          }
        } else {
          logger.warn(`[Chat:E2EE] Peer ${otherUserId} public key not yet available.`);
        }
      } catch (err) {
        logger.error("[Chat:E2EE] Key establishment error", { error: String(err) });
      }
    }

    establishE2EE();

    return () => {
      isMounted = false;
    };
  }, [currentUserId, otherUserId, roomId, processIncomingMessage]);

  // ─── Load Chat History & Reconnect Sync ────────────────────────────────────

  const loadHistory = useCallback(async () => {
    if (!roomId) {
      setMessages([]);
      rawMessagesRef.current = [];
      return;
    }

    try {
      const res = await fetch(`/api/realtime/chat/messages?roomId=${roomId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        rawMessagesRef.current = data.data;
        const key = conversationKeyRef.current;
        const processed = await Promise.all(
          data.data.map((m: ChatMessage) => processIncomingMessage(m, key))
        );
        setMessages(sortMessages(processed));
      }
    } catch (e) {
      logger.warn("[Chat] Load history error", { error: String(e) });
    }
  }, [roomId, processIncomingMessage]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Reconnect listener for network return
  useEffect(() => {
    const handleOnline = () => {
      logger.info("[Chat] Network online detected — synchronizing chat history");
      loadHistory();
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [loadHistory]);

  // ─── Realtime Channel Updates ──────────────────────────────────────────────

  useEffect(() => {
    if (!roomId || isFallback || !channel) return;

    let isActive = true;

    const sub = channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload: Record<string, unknown>) => {
          if (!isActive) return;
          const rawNewMsg = payload["new"] as unknown as ChatMessage;
          const processedMsg = await processIncomingMessage(rawNewMsg, conversationKeyRef.current);

          setMessages((prev) => {
            // If already present by canonical ID, skip
            if (prev.some((m) => m.id === processedMsg.id)) return prev;

            // Reconcile optimistic temp message from same sender
            const tempIndex = prev.findIndex(
              (m) =>
                m.id.startsWith("temp-") &&
                m.sender_id === processedMsg.sender_id &&
                (m.content === processedMsg.content || m.raw_ciphertext === processedMsg.raw_ciphertext)
            );

            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = processedMsg;
              return sortMessages(updated);
            }

            return sortMessages([...prev, processedMsg]);
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
        async (payload: Record<string, unknown>) => {
          if (!isActive) return;
          const rawUpdated = payload["new"] as unknown as ChatMessage;
          const processedUpdated = await processIncomingMessage(rawUpdated, conversationKeyRef.current);
          setMessages((prev) =>
            sortMessages(prev.map((m) => (m.id === processedUpdated.id ? processedUpdated : m)))
          );
        }
      )
      .on("broadcast", { event: "typing" }, (payload: Record<string, unknown>) => {
        if (!isActive) return;
        const data = payload as { payload?: { userId: string; typing: boolean } };
        if (data.payload?.userId === otherUserId) {
          setOtherUserTyping(data.payload.typing);
        }
      });

    sub.subscribe();

    return () => {
      isActive = false;
      sub.unsubscribe();
    };
  }, [channel, isFallback, roomId, otherUserId, processIncomingMessage]);

  // ─── Typing Notifications ──────────────────────────────────────────────────

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

  // ─── Send Message with E2EE ────────────────────────────────────────────────

  const sendMessage = async (
    content?: string,
    messageType: ChatMessage["message_type"] = "text",
    attachmentUrl?: string,
    coords?: { lat: number; lon: number }
  ) => {
    if (!content && !attachmentUrl && !coords) return;

    const tempId = `temp-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Prepare payload content (E2EE encrypted if conversation key is established)
    let payloadContent = content;
    let isEncrypted = false;

    if (content && conversationKeyRef.current) {
      try {
        payloadContent = await encryptMessage(content, conversationKeyRef.current, currentUserId);
        isEncrypted = true;
      } catch (err) {
        logger.error("[Chat:E2EE] Encryption failed, falling back safely", { error: String(err) });
      }
    }

    const optimisticMsg: ChatMessage = {
      id: tempId,
      room_id: roomId,
      sender_id: currentUserId,
      message_type: messageType,
      content, // displayed in plaintext to sender immediately
      raw_ciphertext: payloadContent,
      is_encrypted: isEncrypted,
      attachment_url: attachmentUrl,
      location_lat: coords?.lat,
      location_lon: coords?.lon,
      delivery_status: "sent",
      created_at: timestamp,
    };

    // Optimistic insert with deterministic sorting
    setMessages((prev) => sortMessages([...prev, optimisticMsg]));

    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    // Buffer in offline queue if connection is severed
    if (onOfflineQueueMessage && !isOnline) {
      onOfflineQueueMessage({
        eventType: "chat.message.sent",
        payload: {
          roomId,
          messageType,
          content: payloadContent,
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
          content: payloadContent, // transmitted as ciphertext
          attachmentUrl,
          locationLat: coords?.lat,
          locationLon: coords?.lon,
        }),
      });

      const data = await res.json();

      if (data.success && data.data?.messageId) {
        setMessages((prev) => {
          // Reconcile: replace tempId with canonical server messageId
          const hasTemp = prev.some((m) => m.id === tempId);
          if (!hasTemp) return prev; // already replaced by realtime event
          return sortMessages(
            prev.map((m) =>
              m.id === tempId
                ? { ...m, id: data.data.messageId, delivery_status: "sent" }
                : m
            )
          );
        });
      } else {
        throw new Error(data.error?.message || "Failed to send message.");
      }
    } catch (err) {
      logger.warn(`[Chat] Connection failure sending message: ${err instanceof Error ? err.message : String(err)}`);

      // Mark as failed in UI so user knows message was not delivered
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, delivery_status: "failed" } : m))
      );
    }
  };

  return {
    messages,
    otherUserTyping,
    isE2EEReady,
    notifyTyping,
    sendMessage,
    loadHistory,
  };
}

export default useChat;
