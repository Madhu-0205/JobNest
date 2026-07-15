"use client";

import { useState, useCallback } from "react";
import type { ModerationItem, ModerationStats } from "@/services/moderation-service";

export function useModeration() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/moderation");
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items || []);
        setStats(data.data.stats || null);
      } else {
        setError(data.error || "Failed to fetch moderation queue.");
      }
    } catch {
      setError("Network error fetching moderation queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  const takeAction = useCallback(async (
    itemId: string,
    action: "approved" | "rejected" | "escalated",
    note?: string
  ) => {
    try {
      setActionLoading(itemId);
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, action, note }),
      });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        setStats((prev) => prev ? { ...prev, pending: Math.max(0, prev.pending - 1) } : prev);
      }
      return data.success;
    } catch {
      return false;
    } finally {
      setActionLoading(null);
    }
  }, []);

  return { items, stats, loading, actionLoading, error, fetchQueue, takeAction };
}
