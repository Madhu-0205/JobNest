import { NextRequest, NextResponse } from "next/server";
import { EventBus } from "@/services/event-bus";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";
import { presenceUpdateSchema } from "@/features/realtime/schemas";
import { AuthorizationError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const user = await AuthorizationGuard.assertPermission(PERMISSIONS.PROFILES_VIEW);
    const body = await req.json();
    const validated = presenceUpdateSchema.parse(body);

    // Publish to global server Event Bus
    await EventBus.publish("identity.user.updated", {
      userId: user,
      status: validated.status,
      timestamp: new Date().toISOString(),
    }, user);

    return NextResponse.json({ success: true, status: validated.status });
  } catch (err) {
    if (err instanceof AuthorizationError) {
      return NextResponse.json({
        success: false,
        error: { code: "UNAUTHORIZED", message: err.message }
      }, { status: 401 });
    }
    return NextResponse.json({
      success: false,
      error: { code: "BAD_REQUEST", message: err instanceof Error ? err.message : "Invalid payload." }
    }, { status: 400 });
  }
}
