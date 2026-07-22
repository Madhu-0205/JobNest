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

export class RecommendationEngine {
  /**
   * Generates ranked worker recommendations for a given user/opportunity.
   * Uses composite weighted scoring across all dimensions, tightly integrated with live GPS PostGIS.
   */
  static async recommend(
    userId: string,
    type: "worker" | "employer" | "opportunity",
    lat: number,
    lng: number,
    maxDistanceMeters: number = 50000,
    weights: RankingWeights = DEFAULT_WEIGHTS
  ): Promise<RankedRecommendation> {
    try {
      const supabase = await createServerClient();

      if (type === "worker") {
        // Query real workers from PostGIS RPC `find_nearby_workers`
        const { data: nearbyWorkers, error: workersErr } = await supabase.rpc("find_nearby_workers", {
          center_lat: lat,
          center_lon: lng,
          max_distance_meters: maxDistanceMeters,
          limit_count: 50
        });

        if (workersErr) throw workersErr;

        const candidateList = nearbyWorkers || [];
        if (candidateList.length === 0) {
          return { userId, type, candidates: [], generatedAt: new Date().toISOString() };
        }

        const userIds = candidateList.map((w: { user_id: string }) => w.user_id);

        // Fetch remaining profile details (ratings, trust_score, availability)
        const [ratingsRes, profilesRes, trustRes] = await Promise.all([
          supabase.from("ratings").select("reviewee_id, score").in("reviewee_id", userIds),
          supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds),
          supabase.from("trust_scores").select("user_id, score").in("user_id", userIds)
        ]);

        const ratingsMap: Record<string, number[]> = {};
        (ratingsRes.data || []).forEach((r) => {
          if (!ratingsMap[r.reviewee_id]) ratingsMap[r.reviewee_id] = [];
          ratingsMap[r.reviewee_id].push(Number(r.score));
        });

        const profilesMap = Object.fromEntries((profilesRes.data || []).map((p) => [p.id, p]));
        const trustMap = Object.fromEntries((trustRes.data || []).map((t) => [t.user_id, t]));

        const candidates = candidateList.map((w: { user_id: string; experience_years: number; distance_meters: number; job_title: string }) => {
          const userRatings = ratingsMap[w.user_id] || [];
          const ratingAvg = userRatings.length > 0 
            ? userRatings.reduce((sum, s) => sum + s, 0) / userRatings.length 
            : 5.0;

          const profile = profilesMap[w.user_id];
          const trust = trustMap[w.user_id];
          
          const trustVal = (trust?.score ?? 80) / 100;
          const ratingVal = ratingAvg / 5.0;
          const availabilityVal = 0.9; // We don't have availability directly in `worker_profiles` RPC response, default to 0.9
          const experienceVal = Math.min(1.0, (w.experience_years || 1) / 10);
          
          // distance score: closer is better
          const maxDist = Math.max(1, maxDistanceMeters);
          const distanceScore = Math.max(0, 1.0 - (w.distance_meters / maxDist));
          
          // Compute score components
          const skillScore = experienceVal;
          const trustScore = trustVal;
          const ratingScore = ratingVal;
          const availabilityScore = availabilityVal;
          const responseTimeScore = 0.9;
          const salaryScore = 0.8;

          const compositeScore = parseFloat((
            skillScore * weights.skills +
            trustScore * weights.trust +
            distanceScore * weights.distance +
            ratingScore * weights.rating +
            availabilityScore * weights.availability +
            responseTimeScore * weights.responseTime +
            salaryScore * weights.salary
          ).toFixed(4));

          return {
            id: w.user_id,
            name: profile?.full_name || "Worker Candidate",
            title: w.job_title || "General Helper",
            compositeScore,
            skillScore,
            trustScore,
            distanceScore,
            ratingScore,
            availabilityScore,
            responseTimeScore,
            salaryScore
          };
        });

        // Sort by composite score descending
        candidates.sort((a: RecommendationCandidate, b: RecommendationCandidate) => b.compositeScore - a.compositeScore);

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

        return result;
      }

      // If not worker (e.g. employer / opportunity), use `find_nearby_opportunities` RPC
      const { data: nearbyOpportunities, error: oppsErr } = await supabase.rpc("find_nearby_opportunities", {
        user_lat: lat,
        user_lon: lng,
        max_distance_meters: maxDistanceMeters,
        limit_count: 50
      });

      if (oppsErr) throw oppsErr;

      const candidates = (nearbyOpportunities || []).map((o: { verification_status: string; distance_meters: number; id: string; employer_name: string; title: string }) => {
        const isVerified = o.verification_status === "verified";
        
        const maxDist = Math.max(1, maxDistanceMeters);
        const distanceScore = Math.max(0, 1.0 - (o.distance_meters / maxDist));
        
        const skillScore = 0.8;
        const trustScore = isVerified ? 0.98 : 0.85;
        const ratingScore = 0.8;
        const availabilityScore = 0.9;
        const responseTimeScore = 0.85;
        const salaryScore = 0.8;

        const compositeScore = parseFloat((
          skillScore * weights.skills +
          trustScore * weights.trust +
          distanceScore * weights.distance +
          ratingScore * weights.rating +
          availabilityScore * weights.availability +
          responseTimeScore * weights.responseTime +
          salaryScore * weights.salary
        ).toFixed(4));

        return {
          id: o.id,
          name: o.employer_name || "Local Employer",
          title: o.title || "Gig Work Opportunity",
          compositeScore,
          skillScore,
          trustScore,
          distanceScore,
          ratingScore,
          availabilityScore,
          responseTimeScore,
          salaryScore
        };
      });

      // Sort by composite score descending
      candidates.sort((a: RecommendationCandidate, b: RecommendationCandidate) => b.compositeScore - a.compositeScore);

      return {
        userId,
        type,
        candidates,
        generatedAt: new Date().toISOString(),
      };
    } catch (err) {
      logger.error("[RecommendationEngine] Recommendation failed:", err as Record<string, unknown>);
      throw err;
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
      logger.warn("[RecommendationEngine] Semantic search bypassed. Returning empty results.");
      return [];
    }
  }
}
