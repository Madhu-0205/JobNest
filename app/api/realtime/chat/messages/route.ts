import { NextRequest, NextResponse } from "next/server";
import { getChatMessagesAction, sendMessageAction } from "@/features/realtime/actions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const limitStr = searchParams.get("limit");
  const before = searchParams.get("before");

  if (!roomId) {
    return NextResponse.json({ success: false, error: { code: "MISSING_ROOM_ID", message: "roomId query is required." } }, { status: 400 });
  }

  const limit = limitStr ? parseInt(limitStr) : 50;
  const result = await getChatMessagesAction(roomId, limit, before || undefined);

  if (result.success) {
    return NextResponse.json({ success: true, data: result.data });
  }
  const msg = result.error?.message?.toLowerCase() || "";
  const code = result.error?.code?.toLowerCase() || "";
  const isAuthRequired = code.includes("authorization") || msg.includes("authentication required") || code === "unauthorized";
  const isDenied = msg.includes("access denied") || code === "forbidden" || msg.includes("not a participant");
  const status = isAuthRequired ? 401 : isDenied ? 403 : 400;
  return NextResponse.json({ success: false, error: result.error }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await sendMessageAction(body);
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    }
    const msg = result.error?.message?.toLowerCase() || "";
    const code = result.error?.code?.toLowerCase() || "";
    const isAuthRequired = code.includes("authorization") || msg.includes("authentication required") || code === "unauthorized";
    const isDenied = msg.includes("access denied") || code === "forbidden" || msg.includes("not a participant");
    const status = isAuthRequired ? 401 : isDenied ? 403 : 400;
    return NextResponse.json({ success: false, error: result.error }, { status });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: { code: "BAD_REQUEST", message: err instanceof Error ? err.message : "Invalid payload." }
    }, { status: 400 });
  }
}
