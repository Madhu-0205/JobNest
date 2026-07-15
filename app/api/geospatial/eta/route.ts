import { NextRequest, NextResponse } from "next/server";
import { estimateEtaAction } from "@/features/geospatial/actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const result = await estimateEtaAction(body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Invalid payload" } },
      { status: 400 }
    );
  }
}
