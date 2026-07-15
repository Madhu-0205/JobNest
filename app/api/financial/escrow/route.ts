import { NextRequest, NextResponse } from "next/server";
import { manageEscrowReleaseAction } from "@/features/financial/actions";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { escrowId, amount, type } = body;
    const result = await manageEscrowReleaseAction(escrowId, amount, type);
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

    const { data: escrows } = await supabase
      .from("escrows")
      .select("*")
      .or(`payer_id.eq.${user.id},payee_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    return NextResponse.json({ success: true, data: escrows || [] });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: { code: "UNKNOWN_ERROR", message: err instanceof Error ? err.message : "Fetch escrows failed." }
    }, { status: 500 });
  }
}
