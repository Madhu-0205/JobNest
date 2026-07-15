"use client";

import { useState, useCallback } from "react";

export interface ProfileEnhancementResult {
  enhanced: string;
  model: string;
  latencyMs: number;
  suggestions: string[];
}

export function useProfileEnhancement() {
  const [result, setResult] = useState<ProfileEnhancementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhance = useCallback(async (
    fullName: string,
    currentDescription?: string,
    skills?: string[]
  ) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/ai/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, currentDescription, skills }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Enhancement failed.");
      }
    } catch {
      setError("Network error during profile enhancement.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, enhance };
}
