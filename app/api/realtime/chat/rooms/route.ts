import { NextRequest, NextResponse } from "next/server";
import { getChatRoomsAction, createChatRoomAction } from "@/features/realtime/actions";

export async function GET() {
  const result = await getChatRoomsAction();
  if (result.success) {
    return NextResponse.json({ success: true, data: result.data });
  }
  return NextResponse.json({ success: false, error: result.error }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { opportunityId, employerId, workerId } = body;
    const result = await createChatRoomAction(opportunityId || null, employerId, workerId);
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
