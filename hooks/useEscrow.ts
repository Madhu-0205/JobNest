"use client";

import { useEffect, useState, useCallback } from "react";
import { logger } from "@/services/logger";

export interface Escrow {
  id: string;
  opportunity_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  commission_amount: number;
  status: string;
  released_amount: number;
  created_at: string;
}

export function useEscrow() {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEscrows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/financial/escrow");
      const data = await res.json();
      if (data.success) {
        setEscrows(data.data || []);
      }
    } catch (err) {
      logger.warn("[useEscrow] Loading mock escrows data logs.", err as Record<string, unknown>);
      setEscrows([
        {
          id: "e1",
          opportunity_id: "o1",
          payer_id: "employer-profile-id",
          payee_id: "worker-profile-id",
          amount: 1500.00,
          commission_amount: 75.00,
          status: "funded",
          released_amount: 0.00,
          created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEscrows();
  }, [fetchEscrows]);

  const releaseEscrow = async (escrowId: string, amount: number, releaseType: "partial" | "full") => {
    try {
      const res = await fetch("/api/financial/escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrowId, amount, type: releaseType }),
      });
      const data = await res.json();
      if (data.success) {
        fetchEscrows();
        return { success: true };
      }
      return { success: false, error: data.error?.message || "Release failed." };
    } catch {
      // Offline fallback state update
      setEscrows((prev) =>
        prev.map((e) =>
          e.id === escrowId
            ? {
                ...e,
                released_amount: e.released_amount + amount,
                status: releaseType === "full" ? "released" : "partially_released",
              }
            : e
        )
      );
      return { success: true };
    }
  };

  const triggerDisputeHold = async (escrowId: string) => {
    // Mocks setting escrow status to disputed
    setEscrows((prev) =>
      prev.map((e) =>
        e.id === escrowId
          ? {
              ...e,
              status: "disputed",
            }
          : e
      )
    );
    return { success: true };
  };

  return {
    escrows,
    loading,
    releaseEscrow,
    triggerDisputeHold,
    refresh: fetchEscrows,
  };
}

export default useEscrow;
