"use client";

import { useEffect, useState, useCallback } from "react";
import { logger } from "@/services/logger";

interface TrustScoreData {
  score: number;
  factors: {
    identity_verified: boolean;
    business_verified: boolean;
    profile_complete: boolean;
    rating_average: number;
    disputes_count: number;
    reports_count: number;
    account_age_months: number;
  };
  badges?: Array<{
    code: string;
    name: string;
    icon_url: string | null;
    description: string | null;
  }>;
}

/**
 * Custom React Hook: Trust Score Watcher.
 * Fetches the dynamic trust score breakdown details for a user.
 */
export function useTrustScore(userId: string) {
  const [trustScore, setTrustScore] = useState<TrustScoreData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchScore = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/trust/score?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch trust score");
      
      const scoreData = await res.json();
      if (scoreData.success && scoreData.data) {
        setTrustScore(scoreData.data);
      } else {
        throw new Error(scoreData.error || "No data returned.");
      }
    } catch (err) {
      logger.error(`[useTrustScore] Failed to load trust score: ${err}`);
      setTrustScore(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  return {
    trustScore,
    loading,
    refresh: fetchScore,
  };
}

export default useTrustScore;
