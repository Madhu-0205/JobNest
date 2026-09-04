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
  explanation?: string;
  reasons?: string[];
}

export type RecommendationType = "worker" | "employer" | "opportunity" | "organization" | "connection" | "event" | "post";

export interface RankedRecommendation {
  userId: string;
  type: RecommendationType;
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
   * Generates ranked recommendations for a given user.
   * Uses composite weighted scoring across all dimensions, integrated with live GPS PostGIS.
   */
  static async recommend(
    userId: string,
    type: RecommendationType,
    lat: number,
    lng: number,
    maxDistanceMeters: number = 50000,
    weights: RankingWeights = DEFAULT_WEIGHTS
  ): Promise<RankedRecommendation> {
    try {
      const supabase = await createServerClient();
      let candidates: RecommendationCandidate[] = [];

      if (type === "worker" || type === "connection") {
        const { data: nearbyWorkers, error: workersErr } = await supabase.rpc("find_nearby_workers", {
          center_lat: lat,
          center_lon: lng,
          max_distance_meters: maxDistanceMeters,
          limit_count: 50
        });
        if (workersErr) throw workersErr;

        const candidateList = nearbyWorkers || [];
        if (candidateList.length > 0) {
          const userIds = candidateList.map((w: { user_id: string }) => w.user_id);
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

          candidates = candidateList.map((w: { user_id: string; experience_years: number; distance_meters: number; job_title: string }) => {
            const userRatings = ratingsMap[w.user_id] || [];
            const ratingAvg = userRatings.length > 0 ? userRatings.reduce((sum, s) => sum + s, 0) / userRatings.length : 5.0;
            const profile = profilesMap[w.user_id];
            const trust = trustMap[w.user_id];
            
            const trustVal = (trust?.score ?? 80) / 100;
            const experienceVal = Math.min(1.0, (w.experience_years || 1) / 10);
            const maxDist = Math.max(1, maxDistanceMeters);
            const distanceScore = Math.max(0, 1.0 - (w.distance_meters / maxDist));
            
            const compositeScore = parseFloat((
              experienceVal * weights.skills +
              trustVal * weights.trust +
              distanceScore * weights.distance +
              (ratingAvg / 5.0) * weights.rating +
              0.9 * weights.availability +
              0.9 * weights.responseTime +
              0.8 * weights.salary
            ).toFixed(4));

            return {
              id: w.user_id,
              name: profile?.full_name || "Professional",
              title: w.job_title || "Worker",
              compositeScore,
              skillScore: experienceVal,
              trustScore: trustVal,
              distanceScore,
              ratingScore: ratingAvg / 5.0,
              availabilityScore: 0.9,
              responseTimeScore: 0.9,
              salaryScore: 0.8
            };
          });
        }
      } else if (type === "organization") {
        const { data: nearbyOrgs, error: orgsErr } = await supabase.rpc("find_nearby_organizations", {
          center_lat: lat,
          center_lon: lng,
          max_distance_meters: maxDistanceMeters,
          limit_count: 50
        });
        if (orgsErr) throw orgsErr;

        candidates = (nearbyOrgs || []).map((o: { id: string; name: string; industry: string; verification_status: string; distance_meters: number }) => {
          const isVerified = o.verification_status === "verified";
          const maxDist = Math.max(1, maxDistanceMeters);
          const distanceScore = Math.max(0, 1.0 - (o.distance_meters / maxDist));
          const trustScore = isVerified ? 0.98 : 0.85;
          const compositeScore = parseFloat((
            0.8 * weights.skills +
            trustScore * weights.trust +
            distanceScore * weights.distance +
            0.8 * weights.rating +
            0.9 * weights.availability +
            0.85 * weights.responseTime +
            0.8 * weights.salary
          ).toFixed(4));

          return {
            id: o.id,
            name: o.name || "Organization",
            title: o.industry || "Company",
            compositeScore,
            skillScore: 0.8,
            trustScore,
            distanceScore,
            ratingScore: 0.8,
            availabilityScore: 0.9,
            responseTimeScore: 0.85,
            salaryScore: 0.8
          };
        });
      } else if (type === "event") {
        const { data: nearbyEvents, error: eventsErr } = await supabase.rpc("find_nearby_events", {
          center_lat: lat,
          center_lon: lng,
          max_distance_meters: maxDistanceMeters,
          limit_count: 50
        });
        if (eventsErr) throw eventsErr;

        candidates = (nearbyEvents || []).map((e: { id: string; title: string; category: string; distance_meters: number }) => {
          const maxDist = Math.max(1, maxDistanceMeters);
          const distanceScore = Math.max(0, 1.0 - (e.distance_meters / maxDist));
          const compositeScore = parseFloat((
            0.8 * weights.skills +
            0.9 * weights.trust +
            distanceScore * weights.distance +
            0.8 * weights.rating +
            0.9 * weights.availability +
            0.8 * weights.responseTime +
            0.8 * weights.salary
          ).toFixed(4));

          return {
            id: e.id,
            name: e.title || "Event",
            title: e.category || "Networking",
            compositeScore,
            skillScore: 0.8,
            trustScore: 0.9,
            distanceScore,
            ratingScore: 0.8,
            availabilityScore: 0.9,
            responseTimeScore: 0.8,
            salaryScore: 0.8
          };
        });
      } else {
        // Fallback for opportunity / employer
        const { data: nearbyOpportunities, error: oppsErr } = await supabase.rpc("find_nearby_opportunities", {
          user_lat: lat,
          user_lon: lng,
          max_distance_meters: maxDistanceMeters,
          limit_count: 50
        });
        if (oppsErr) throw oppsErr;

        candidates = (nearbyOpportunities || []).map((o: { verification_status: string; distance_meters: number; id: string; employer_name: string; title: string }) => {
          const isVerified = o.verification_status === "verified";
          const maxDist = Math.max(1, maxDistanceMeters);
          const distanceScore = Math.max(0, 1.0 - (o.distance_meters / maxDist));
          const trustScore = isVerified ? 0.98 : 0.85;
          const compositeScore = parseFloat((
            0.8 * weights.skills +
            trustScore * weights.trust +
            distanceScore * weights.distance +
            0.8 * weights.rating +
            0.9 * weights.availability +
            0.85 * weights.responseTime +
            0.8 * weights.salary
          ).toFixed(4));

          return {
            id: o.id,
            name: o.employer_name || "Local Employer",
            title: o.title || "Opportunity",
            compositeScore,
            skillScore: 0.8,
            trustScore,
            distanceScore,
            ratingScore: 0.8,
            availabilityScore: 0.9,
            responseTimeScore: 0.85,
            salaryScore: 0.8
          };
        });
      }

      // Sort by composite score descending
      candidates.sort((a, b) => b.compositeScore - a.compositeScore);

      // Filter out self if connection
      if (type === "connection") {
        candidates = candidates.filter(c => c.id !== userId);
      }

      // AI Explanations for top 3
      if (candidates.length > 0) {
        await this.generateExplanations(userId, type, candidates);
      }

      const result: RankedRecommendation = {
        userId,
        type,
        candidates,
        generatedAt: new Date().toISOString(),
      };

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
    } catch (err) {
      logger.error("[RecommendationEngine] Recommendation failed:", err as Record<string, unknown>);
      throw err;
    }
  }

  private static async generateExplanations(
    userId: string,
    type: RecommendationType,
    candidates: RecommendationCandidate[]
  ) {
    const topCandidates = candidates.slice(0, 3);
    if (topCandidates.length === 0) return;

    try {
      const supabase = await createServerClient();
      const { data: cached } = await supabase
        .from("ai_explanations_cache")
        .select("target_id, explanation, reasons")
        .eq("user_id", userId)
        .eq("target_type", type)
        .in("target_id", topCandidates.map(c => c.id));

      const cachedMap = Object.fromEntries((cached || []).map(c => [c.target_id, c]));
      const toGenerate = topCandidates.filter(c => !cachedMap[c.id]);

      if (toGenerate.length > 0) {
        const { data: profile } = await supabase.from("worker_profiles").select("skills, bio").eq("user_id", userId).single();
        
        const prompt = `Generate a 1-sentence reason why these candidates are recommended for the user.
Do NOT invent skills, experiences, or locations. Keep reasons factual based on the provided candidates.
User Skills: ${(profile?.skills || []).join(", ") || "None provided"}.
User Bio: ${profile?.bio || "N/A"}.

Candidates:
${toGenerate.map((c, i) => `${i+1}. ID: ${c.id}, Name: ${c.name}, Title: ${c.title}, Distance Score: ${c.distanceScore.toFixed(2)}, Skill Score: ${c.skillScore.toFixed(2)}`).join("\n")}

Respond ONLY with a valid JSON object where keys are candidate IDs and values are objects containing "explanation" (string) and "reasons" (array of short string tags like SKILL_MATCH, LOCATION_MATCH). Do NOT include markdown code blocks.`;

        const aiResult = await AIProviderService.complete(prompt, "You are an explainable AI recommendation agent. Return valid JSON only. Never hallucinate data.");
        let parsed: Record<string, { explanation: string; reasons: string[] }> = {};
        
        try {
          let text = aiResult.text.trim();
          if (text.startsWith("```json")) {
            text = text.substring(7);
          } else if (text.startsWith("```")) {
            text = text.substring(3);
          }
          if (text.endsWith("```")) {
            text = text.substring(0, text.length - 3);
          }
          parsed = JSON.parse(text);
        } catch (e) {
          logger.error("[RecommendationEngine] JSON parse failed for explanations", e);
        }
        
        const newCacheRows = [];
        for (const c of toGenerate) {
          if (parsed[c.id]) {
            c.explanation = parsed[c.id].explanation;
            c.reasons = parsed[c.id].reasons;
            newCacheRows.push({
              user_id: userId,
              target_type: type,
              target_id: c.id,
              explanation: c.explanation,
              reasons: c.reasons
            });
          }
        }
        
        if (newCacheRows.length > 0) {
          await supabase.from("ai_explanations_cache").upsert(newCacheRows);
        }
      }

      for (const c of topCandidates) {
        if (cachedMap[c.id]) {
          c.explanation = cachedMap[c.id].explanation;
          c.reasons = cachedMap[c.id].reasons;
        }
      }
    } catch (err) {
      logger.error("[RecommendationEngine] generateExplanations failed", err as Error);
    }
  }

  /**
   * AI-enhanced skill matching using embeddings similarity.
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
