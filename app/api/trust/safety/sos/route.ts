import { NextRequest, NextResponse } from "next/server";
import { triggerSosAlertAction } from "@/features/trust/actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const opportunityId = body.opportunityId || null;
    const result = await triggerSosAlertAction(opportunityId, body);
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
