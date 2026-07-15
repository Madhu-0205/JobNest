"use client";

import { useState, useCallback } from "react";

export interface SystemConfig {
  flags: Record<string, boolean>;
  settings: { key: string; category: string; description: string; value: unknown }[];
}

export function useSystemConfig() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/config");
      const data = await res.json();
      if (data.success) {
        setConfig(data.data);
      } else {
        setError(data.error || "Failed to fetch config.");
      }
    } catch {
      setError("Network error fetching system config.");
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFlag = useCallback(async (flagKey: string, isEnabled: boolean) => {
    // Optimistic update
    setConfig((prev) => prev ? {
      ...prev,
      flags: { ...prev.flags, [flagKey]: isEnabled },
    } : prev);

    try {
      setSaving(true);
      await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagKey, isEnabled }),
      });
    } catch {
      // Revert on failure
      setConfig((prev) => prev ? {
        ...prev,
        flags: { ...prev.flags, [flagKey]: !isEnabled },
      } : prev);
    } finally {
      setSaving(false);
    }
  }, []);

  return { config, loading, saving, error, fetchConfig, toggleFlag };
}
