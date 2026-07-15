

import { createServerClient } from "@/lib/supabase/server";
import { AIProviderService } from "@/services/ai-provider-service";
import { logger } from "@/services/logger";

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface RecommendationCandidate {
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

export interface RankedRecommendation {
  userId: string;
  type: "worker" | "employer" | "opportunity";
  candidates: RecommendationCandidate[];
  generatedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// Ranking Weight Configuration
// ─────────────────────────────────────────────────────────────────

interface RankingWeights {
  skills: number;
  trust: number;
  distance: number;
  rating: number;
  availability: number;
  responseTime: number;
  salary: number;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  skills: 0.25,
  trust: 0.20,
  distance: 0.15,
  rating: 0.15,
  availability: 0.10,
  responseTime: 0.08,
  salary: 0.07,
};

// ─────────────────────────────────────────────────────────────────
// Simulated Worker Pool (sandbox data)
// ─────────────────────────────────────────────────────────────────

const SIMULATED_WORKERS: RecommendationCandidate[] = [
  { id: "w1", name: "Rajesh Kumar", title: "Plumber & Electrician", compositeScore: 0, skillScore: 0.92, trustScore: 0.88, distanceScore: 0.95, ratingScore: 0.90, availabilityScore: 0.85, responseTimeScore: 0.78, salaryScore: 0.82 },
  { id: "w2", name: "Priya Sharma", title: "House Cleaner", compositeScore: 0, skillScore: 0.85, trustScore: 0.95, distanceScore: 0.70, ratingScore: 0.92, availabilityScore: 0.90, responseTimeScore: 0.88, salaryScore: 0.75 },
  { id: "w3", name: "Suresh Babu", title: "Carpenter & Painter", compositeScore: 0, skillScore: 0.88, trustScore: 0.82, distanceScore: 0.60, ratingScore: 0.85, availabilityScore: 0.95, responseTimeScore: 0.92, salaryScore: 0.90 },
  { id: "w4", name: "Lakshmi Devi", title: "Cook & Caterer", compositeScore: 0, skillScore: 0.78, trustScore: 0.90, distanceScore: 0.88, ratingScore: 0.88, availabilityScore: 0.72, responseTimeScore: 0.80, salaryScore: 0.85 },
  { id: "w5", name: "Arjun Reddy", title: "Delivery Driver", compositeScore: 0, skillScore: 0.70, trustScore: 0.85, distanceScore: 0.92, ratingScore: 0.80, availabilityScore: 0.88, responseTimeScore: 0.95, salaryScore: 0.78 },
  { id: "w6", name: "Meena Kumari", title: "Tailor & Seamstress", compositeScore: 0, skillScore: 0.95, trustScore: 0.78, distanceScore: 0.75, ratingScore: 0.82, availabilityScore: 0.80, responseTimeScore: 0.70, salaryScore: 0.92 },
  { id: "w7", name: "Ganesh Pillai", title: "Security Guard", compositeScore: 0, skillScore: 0.72, trustScore: 0.92, distanceScore: 0.85, ratingScore: 0.78, availabilityScore: 0.92, responseTimeScore: 0.85, salaryScore: 0.80 },
  { id: "w8", name: "Deepa Nair", title: "Tutor & Teacher", compositeScore: 0, skillScore: 0.90, trustScore: 0.88, distanceScore: 0.78, ratingScore: 0.95, availabilityScore: 0.75, responseTimeScore: 0.82, salaryScore: 0.70 },
];

// ─────────────────────────────────────────────────────────────────
// Recommendation Engine
// ─────────────────────────────────────────────────────────────────

export class RecommendationEngine {
  /**
   * Generates ranked worker recommendations for a given user/opportunity.
   * Uses composite weighted scoring across all dimensions.
   */
  static async recommend(
    userId: string,
    type: "worker" | "employer" | "opportunity",
    weights: RankingWeights = DEFAULT_WEIGHTS
  ): Promise<RankedRecommendation> {
    try {
      const supabase = await createServerClient();

      // In production, query profiles with embeddings similarity
      // For now, use simulated pool and compute composite scores
      const candidates = SIMULATED_WORKERS.map((c) => ({
        ...c,
        compositeScore: parseFloat((
          c.skillScore * weights.skills +
          c.trustScore * weights.trust +
          c.distanceScore * weights.distance +
          c.ratingScore * weights.rating +
          c.availabilityScore * weights.availability +
          c.responseTimeScore * weights.responseTime +
          c.salaryScore * weights.salary
        ).toFixed(4)),
      }));

      // Sort by composite score descending
      candidates.sort((a, b) => b.compositeScore - a.compositeScore);

      const result: RankedRecommendation = {
        userId,
        type,
        candidates,
        generatedAt: new Date().toISOString(),
      };

      // Persist to database
      try {
        await supabase.from("recommendations").insert({
          user_id: userId,
          type,
          results: candidates as unknown as Record<string, unknown>[],
        });
      } catch {
        logger.warn("[RecommendationEngine] Failed to persist to DB. Continuing with in-memory results.");
      }

      logger.info(`[RecommendationEngine] Generated ${candidates.length} ranked ${type} candidates for user ${userId}`);
      return result;
    } catch {
      logger.warn("[RecommendationEngine] Bypassed database. Returning simulated ranked results.");
      const candidates = SIMULATED_WORKERS.map((c) => ({
        ...c,
        compositeScore: parseFloat((
          c.skillScore * weights.skills +
          c.trustScore * weights.trust +
          c.distanceScore * weights.distance +
          c.ratingScore * weights.rating +
          c.availabilityScore * weights.availability +
          c.responseTimeScore * weights.responseTime +
          c.salaryScore * weights.salary
        ).toFixed(4)),
      }));
      candidates.sort((a, b) => b.compositeScore - a.compositeScore);

      return {
        userId,
        type,
        candidates,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * AI-enhanced skill matching using embeddings similarity.
   * Compares a query embedding against worker profile embeddings.
   */
  static async semanticMatch(
    queryText: string,
    userId?: string,
    latitude?: number | null,
    longitude?: number | null,
    maxDistanceMeters = 5000
  ): Promise<{ id: string; title: string; description: string; similarity: number; distance?: number }[]> {
    try {
      const supabase = await createServerClient();
      const embedResult = await AIProviderService.embed(queryText, userId);

      const embeddingStr = `[${embedResult.embedding.join(",")}]`;

      // Choose hybrid or plain semantic search
      if (latitude != null && longitude != null) {
        const { data } = await supabase.rpc("nearby_semantic_search_opportunities", {
          query_embedding: embeddingStr,
          lat: latitude,
          lon: longitude,
          max_distance_meters: maxDistanceMeters,
          match_threshold: 0.3,
          match_count: 20,
        });
        return (data || []) as { id: string; title: string; description: string; similarity: number; distance: number }[];
      }

      const { data } = await supabase.rpc("semantic_search_opportunities", {
        query_embedding: embeddingStr,
        match_threshold: 0.3,
        match_count: 20,
      });
      return (data || []) as { id: string; title: string; description: string; similarity: number }[];
    } catch {
      logger.warn("[RecommendationEngine] Semantic search bypassed. Returning simulated results.");
      return [
        { id: "opp-sim-1", title: "House Cleaning - 2BHK Apartment", description: "Deep cleaning needed for a 2-bedroom apartment in Koramangala.", similarity: 0.89, distance: 1200 },
        { id: "opp-sim-2", title: "Plumbing Repair - Kitchen Sink", description: "Fix leaking kitchen sink pipe and replace washer.", similarity: 0.82, distance: 2400 },
        { id: "opp-sim-3", title: "Electrical Wiring - New Office", description: "Complete electrical setup for a new office space in Indiranagar.", similarity: 0.76, distance: 3800 },
        { id: "opp-sim-4", title: "Farm Labor - Paddy Harvest", description: "Seasonal workers needed for paddy harvesting in Mandya district.", similarity: 0.71, distance: 45000 },
        { id: "opp-sim-5", title: "Tutoring - Class 10 Mathematics", description: "Home tutoring for 10th standard student preparing for board exams.", similarity: 0.65, distance: 1800 },
      ];
    }
  }
}
