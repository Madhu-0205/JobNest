"use client";

import { useState, useCallback } from "react";

export interface SemanticSearchResult {
  id: string;
  title: string;
  description: string;
  similarity: number;
  distance?: number;
}

export function useSemanticSearch() {
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (
    query: string,
    latitude?: number | null,
    longitude?: number | null,
    maxDistanceMeters?: number
  ) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, latitude, longitude, maxDistanceMeters }),
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.data || []);
      } else {
        setError(data.error || "Search failed.");
      }
    } catch {
      setError("Network error during semantic search.");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clearResults };
}
