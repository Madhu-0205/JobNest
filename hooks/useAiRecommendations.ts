"use client";

import { useState, useCallback } from "react";
import { useCurrentLocation } from "@/providers/LocationProvider";

export interface RankedCandidate {
  id: string;
  name: string;
  title: string;
  compositeScore: number;
  skillScore: number;
  trustScore: number;
  distanceScore: number;
  ratingScore: number;
  availabilityScore: number;
  responseTimeScore: number;
  salaryScore: number;
}

export interface RecommendationResult {
  userId: string;
  type: string;
  candidates: RankedCandidate[];
  generatedAt: string;
}

export function useAiRecommendations() {
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { latitude, longitude } = useCurrentLocation();

  const fetchRecommendations = useCallback(async (
    type: "worker" | "employer" | "opportunity" = "worker",
    radius: number = 50000
  ) => {
    if (latitude === null || longitude === null) {
      setError("Waiting for live location to fetch recommendations.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/ai/recommendations?type=${type}&lat=${latitude}&lng=${longitude}&radius=${radius}`);
      const data = await res.json();

      if (data.success) {
        setRecommendation(data.data);
      } else {
        setError(data.error || "Failed to fetch recommendations.");
      }
    } catch {
      setError("Network error fetching recommendations.");
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude]);

  return { recommendation, loading, error, fetchRecommendations };
}
