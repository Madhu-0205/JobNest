import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { TrustScoreEngine } from "@/services/trust-score-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    const supabase = await createServerClient();

    // Verify user profile exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 });
    }
    
    // First, try to fetch the existing score
    const { data: initialScore } = await supabase
      .from("trust_scores")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
      
    let trustScore = initialScore;
    // If it doesn't exist, compute it lazily
    if (!trustScore) {
      await TrustScoreEngine.calculateAndUpdate(userId);
      // Re-fetch
      const { data: updatedScore } = await supabase
        .from("trust_scores")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      trustScore = updatedScore;
    }

    if (!trustScore) {
      return NextResponse.json({ success: false, error: "Failed to load trust score" }, { status: 500 });
    }

    // Also fetch active badges
    const { data: userBadges } = await supabase
      .from("user_badges")
      .select("badges(code, name, icon_url, description)")
      .eq("user_id", userId)
      .eq("is_active", true);

    const badges = userBadges?.map(ub => ub.badges) || [];

    return NextResponse.json({ 
      success: true, 
      data: {
        score: trustScore.score,
        factors: trustScore.factors,
        badges
      }
    });

  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }, { status: 500 });
  }
}
