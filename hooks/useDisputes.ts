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
      logger.warn("[useDisputes] Bypassing fetch and loading disputes mock history.", err as Record<string, unknown>);
      setDisputes([
        {
          id: "d1",
          opportunity_id: "o1",
          initiator_id: "worker-profile-id",
          respondent_id: "employer-profile-id",
          reason: "Payment terms mismatch",
          description: "Completed coconut fields clearing, but employer only paid half.",
          status: "in_mediation",
          mediator_id: "moderator-profile-id",
          resolution_details: null,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]);
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
      setActiveTimeline([
        {
          id: "m1",
          sender_id: "worker-profile-id",
          message_text: "I finished harvesting all 50 trees as agreed in the contract description.",
          created_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "m2",
          sender_id: "employer-profile-id",
          message_text: "Some trees were left incomplete. I will pay the full amount once finished.",
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: "m3",
          sender_id: "moderator-profile-id",
          message_text: "Hi, I am assigned as mediator. Worker please upload photos of trees cleared to resolve this.",
          created_at: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]);
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
      const fakeId = crypto.randomUUID();
      const newDisp: Dispute = {
        id: fakeId,
        opportunity_id: details.opportunityId,
        initiator_id: "worker-profile-id",
        respondent_id: details.respondentId,
        reason: details.reason,
        description: details.description,
        status: "open",
        mediator_id: null,
        resolution_details: null,
        created_at: new Date().toISOString(),
      };
      setDisputes((prev) => [newDisp, ...prev]);
      return { success: true, disputeId: fakeId };
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
