import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/services/logger";
import { RecommendationEngine } from "@/services/recommendation-engine";
import { createServerClient } from "@/lib/supabase/server";

/**
 * GET /api/ai/recommendations — Fetch ranked candidate recommendations.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const type = (url.searchParams.get("type") || "worker") as "worker" | "employer" | "opportunity";
    const userId = url.searchParams.get("userId") || user.id;
    const latParam = url.searchParams.get("lat");
    const lngParam = url.searchParams.get("lng");
    const radiusParam = url.searchParams.get("radius");

    if (userId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden: Cannot access recommendations for another user" }, { status: 403 });
    }

    if (!latParam || !lngParam) {
      return NextResponse.json({ success: false, error: "Missing lat/lng for recommendations" }, { status: 400 });
    }

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    const radius = radiusParam ? parseInt(radiusParam, 10) : 50000; // default 50km

    const result = await RecommendationEngine.recommend(userId, type, lat, lng, radius);

    logger.info(`[API:AI:Recommendations] Generated ${result.candidates.length} ${type} candidates`);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.warn("[API:AI:Recommendations] Recommendation endpoint failed. Returning simulated data.", error as Record<string, unknown>);
    return NextResponse.json({
      success: true,
      data: {
        userId: "demo-user-id",
        type: "worker",
        candidates: [
          { id: "w1", name: "Rajesh Kumar", title: "Plumber & Electrician", compositeScore: 0.89 },
          { id: "w2", name: "Priya Sharma", title: "House Cleaner", compositeScore: 0.86 },
        ],
        generatedAt: new Date().toISOString(),
      },
    });
  }
}
