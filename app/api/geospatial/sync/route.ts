import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/services/logger";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { latitude, longitude, accuracy, speed } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ success: false, error: "Missing coordinates" }, { status: 400 });
    }

    const geomPoint = `POINT(${longitude} ${latitude})`;

    // Update worker profile location which is the main source of truth for searches
    const { error: workerProfileError } = await supabase
      .from("worker_profiles")
      .update({
        location: geomPoint,
      })
      .eq("user_id", user.id);

    if (workerProfileError) {
       logger.warn("[API:Geospatial:Sync] Could not update worker_profiles location", workerProfileError as unknown as Record<string, unknown>);
    }

    // Insert into location_history for telemetry
    const { error: historyError } = await supabase
      .from("location_history")
      .insert({
        user_id: user.id,
        latitude,
        longitude,
        geom: geomPoint,
        speed_mps: speed || null,
        gps_accuracy_meters: accuracy || null,
      });

    if (historyError) {
      logger.warn("[API:Geospatial:Sync] Could not append to location_history", historyError as unknown as Record<string, unknown>);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[API:Geospatial:Sync] Location sync failed", error as Record<string, unknown>);
    return NextResponse.json({ success: false, error: "Sync failed" }, { status: 500 });
  }
}
