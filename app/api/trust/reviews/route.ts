import { NextRequest, NextResponse } from "next/server";
import { submitReviewAction } from "@/features/trust/actions";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await submitReviewAction(body);
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    }
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: { code: "BAD_REQUEST", message: err instanceof Error ? err.message : "Invalid payload." }
    }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized." } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "userId parameter is required." } }, { status: 400 });
    }

    if (userId !== user.id) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Cannot access reviews for another user." } }, { status: 403 });
    }

    const { data: reviews } = await supabase
      .from("reviews")
      .select(`
        id,
        opportunity_id,
        reviewer_id,
        reviewee_id,
        review_text,
        is_verified,
        status,
        attachments,
        created_at,
        ratings (
          score,
          category_scores
        )
      `)
      .eq("reviewee_id", userId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    return NextResponse.json({ success: true, data: reviews || [] });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: { code: "UNKNOWN_ERROR", message: err instanceof Error ? err.message : "Query failed." }
    }, { status: 500 });
  }
}
