import { NextRequest, NextResponse } from "next/server";
import { submitDisputeAction } from "@/features/trust/actions";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await submitDisputeAction(body);
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

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized." } }, { status: 401 });
    }

    const { data: disputes } = await supabase
      .from("disputes")
      .select("*")
      .or(`initiator_id.eq.${user.id},respondent_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    return NextResponse.json({ success: true, data: disputes || [] });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: { code: "UNKNOWN_ERROR", message: err instanceof Error ? err.message : "Query failed." }
    }, { status: 500 });
  }
}
