"use client";

import { useState, useCallback } from "react";
import type { AnalyticsDashboard } from "@/services/analytics-engine";

export function useAdminAnalytics() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (data.success) {
        setDashboard(data.data);
      } else {
        setError(data.error || "Failed to fetch analytics.");
      }
    } catch {
      setError("Network error fetching analytics dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { dashboard, loading, error, fetchDashboard };
}
