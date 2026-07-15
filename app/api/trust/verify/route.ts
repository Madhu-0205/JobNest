import { NextRequest, NextResponse } from "next/server";
import { submitVerificationRequestAction, submitBusinessVerificationAction } from "@/features/trust/actions";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Choose between business or standard identity verification based on requestType
    if (body.requestType === "business") {
      const result = await submitBusinessVerificationAction(body);
      if (result.success) return NextResponse.json({ success: true, data: result.data });
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    } else {
      const result = await submitVerificationRequestAction(body);
      if (result.success) return NextResponse.json({ success: true, data: result.data });
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: { code: "BAD_REQUEST", message: err instanceof Error ? err.message : "Invalid payload." }
    }, { status: 400 });
  }
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized." } }, { status: 401 });
    }

    const { data: requests } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ success: true, data: requests || [] });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: { code: "UNKNOWN_ERROR", message: err instanceof Error ? err.message : "Query failed." }
    }, { status: 500 });
  }
}
