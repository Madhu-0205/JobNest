"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/services/logger";

export interface Dispute {
  id: string;
  opportunity_id: string;
  initiator_id: string;
  respondent_id: string;
  reason: string;
  description: string;
  status: string;
  mediator_id: string | null;
  resolution_details: string | null;
  created_at: string;
}

export interface DisputeMessage {
  id: string;
  sender_id: string;
  message_text: string;
  created_at: string;
}

export function useDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [activeTimeline, setActiveTimeline] = useState<DisputeMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/trust/disputes");
      const data = await res.json();
      if (data.success) {
        setDisputes(data.data || []);
      }
    } catch (err) {
      logger.warn("[useDisputes] Failed to fetch disputes", err as Record<string, unknown>);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const loadTimeline = async (disputeId: string) => {
    try {
      const res = await fetch(`/api/trust/disputes/timeline?disputeId=${disputeId}`);
      const data = await res.json();
      if (data.success) {
        setActiveTimeline(data.data || []);
      }
    } catch {
      setActiveTimeline([]);
    }
  };

  const fileDispute = async (details: {
    opportunityId: string;
    respondentId: string;
    reason: string;
    description: string;
  }) => {
    try {
      const res = await fetch("/api/trust/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      const data = await res.json();
      if (data.success) {
        fetchDisputes();
        return { success: true, disputeId: data.data.disputeId };
      }
      return { success: false, error: data.error?.message || "Dispute opening failed." };
    } catch {
      return { success: false, error: "Network error occurred." };
    }
  };

  const sendMessage = async (disputeId: string, text: string, senderId: string) => {
    try {
      await fetch("/api/trust/disputes/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId, messageText: text }),
      });
    } catch {
      // ignore
    }

    const newMsg: DisputeMessage = {
      id: crypto.randomUUID(),
      sender_id: senderId,
      message_text: text,
      created_at: new Date().toISOString(),
    };
    setActiveTimeline((prev) => [...prev, newMsg]);
    return { success: true };
  };

  return {
    disputes,
    activeTimeline,
    loading,
    loadTimeline,
    fileDispute,
    sendMessage,
    refresh: fetchDisputes,
  };
}

export default useDisputes;
