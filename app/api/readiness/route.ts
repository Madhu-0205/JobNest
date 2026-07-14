import { NextResponse } from "next/server";
import { env } from "@/config/env";

/**
 * Readiness Probe.
 * Verifies that all required external infrastructure services (Database, Supabase) are reachable.
 * During Phase 1.5 foundation, this validates env configurations.
 */
export async function GET() {
  try {
    // 1. Validate environment configuration integrity
    if (!env.NEXT_PUBLIC_APP_URL) {
      throw new Error("Application URL (NEXT_PUBLIC_APP_URL) is not defined.");
    }

    // 2. Placeholder check for Supabase / PostgreSQL connectivity (Phase 2)
    // const dbReady = await checkDatabaseConnection();
    // if (!dbReady) throw new Error("Database connection failed.");

    return NextResponse.json(
      {
        status: "ready",
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "not_ready",
        reason: error instanceof Error ? error.message : "Unknown initialization failure",
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
