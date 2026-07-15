"use client";

import { useState, useCallback } from "react";
import type { SupportTicket, TicketStats } from "@/services/support-service";

export function useSupport() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/support");
      const data = await res.json();
      if (data.success) {
        setTickets(data.data.tickets || []);
        setStats(data.data.stats || null);
      } else {
        setError(data.error || "Failed to fetch support tickets.");
      }
    } catch {
      setError("Network error fetching support tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (ticketId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status } : t));
      }
      return data.success;
    } catch {
      return false;
    }
  }, []);

  return { tickets, stats, loading, error, fetchTickets, updateStatus };
}
