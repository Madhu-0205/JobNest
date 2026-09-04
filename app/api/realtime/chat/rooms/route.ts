import { NextRequest, NextResponse } from "next/server";
import { getChatRoomsAction, createChatRoomAction } from "@/features/realtime/actions";

export async function GET() {
  const result = await getChatRoomsAction();
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
    const { opportunityId, employerId, workerId } = body;
    const result = await createChatRoomAction(opportunityId || null, employerId, workerId);
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
