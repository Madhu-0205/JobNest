import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { logger } from "@/services/logger";

const RegisterKeySchema = z.object({
  publicKey: z.record(z.string(), z.unknown()),
  keyId: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "userId parameter is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("user_e2ee_keys")
      .select("user_id, public_key, key_id, algorithm, updated_at")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (error) {
      logger.error("[E2EE Keys API] Query failed", error);
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Public key not registered for this user." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    logger.error("[E2EE Keys API] Internal error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RegisterKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid public key payload." },
        { status: 400 }
      );
    }

    // Upsert the user's public key
    const { error: upsertError } = await supabase
      .from("user_e2ee_keys")
      .upsert({
        user_id: user.id,
        public_key: parsed.data.publicKey,
        key_id: parsed.data.keyId || `key-${Date.now()}`,
        algorithm: "ECDH-P256",
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      logger.error("[E2EE Keys API] Upsert failed", upsertError);
      return NextResponse.json({ success: false, error: "Failed to register public key." }, { status: 500 });
    }

    logger.info(`[E2EE Keys API] Registered public key for user ${user.id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("[E2EE Keys API] Upsert internal error", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
