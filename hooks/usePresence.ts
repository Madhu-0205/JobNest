"use client";

import { useEffect, useState } from "react";
import { useRealtimeChannel } from "./useRealtimeChannel";
import { logger } from "@/services/logger";

/**
 * Custom React Hook: Supabase Presence state synchronizer.
 * - Tracks user status (online, busy, available, working, invisible).
 * - Exposes statuses of other active channel participants.
 * - Simulates state transitions when Supabase is disconnected.
 */
export function usePresence(userId: string, initialStatus = "available") {
  const [status, setStatus] = useState(initialStatus);
  const [users, setUsers] = useState<Record<string, string>>({});
  const { channel, isFallback } = useRealtimeChannel(`presence:global`);

  useEffect(() => {
    if (isFallback) {
      // Seed simulated active profiles
      setUsers({
        "worker-profile-id": "available",
        "employer-profile-id": "working",
        "moderator-id": "busy",
      });

      const interval = setInterval(() => {
        setUsers((prev) => {
          const next = { ...prev };
          const keys = Object.keys(next);
          const randomKey = keys[Math.floor(Math.random() * keys.length)];
          const statuses = ["available", "working", "busy", "online"];
          next[randomKey] = statuses[Math.floor(Math.random() * statuses.length)];
          return next;
        });
      }, 10000);

      return () => clearInterval(interval);
    }

    if (!channel) return;

    // Supabase Presence binding
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const active: Record<string, string> = {};
        
        Object.keys(state).forEach((key) => {
          const userPresences = state[key] as unknown as { user_id: string; status: string }[];
          if (userPresences && userPresences[0]) {
            active[userPresences[0].user_id] = userPresences[0].status;
          }
        });
        setUsers(active);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }: { key: string; newPresences: { user_id: string; status: string }[] }) => {
        logger.info(`[Presence] User joined: ${key}`, newPresences as unknown as Record<string, unknown>);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }: { key: string; leftPresences: { user_id: string; status: string }[] }) => {
        logger.info(`[Presence] User left: ${key}`, leftPresences as unknown as Record<string, unknown>);
      })
      .track({
        user_id: userId,
        status: status,
        last_seen: new Date().toISOString(),
      });

    return () => {};
  }, [channel, isFallback, userId, status]);

  const updateStatus = async (newStatus: string) => {
    setStatus(newStatus);

    try {
      await fetch("/api/realtime/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // ignore
    }

    if (channel && !isFallback) {
      channel.track({
        user_id: userId,
        status: newStatus,
        last_seen: new Date().toISOString(),
      });
    }
  };

  return {
    status,
    users,
    updateStatus,
  };
}

export default usePresence;
