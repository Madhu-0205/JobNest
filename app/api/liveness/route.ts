import { NextResponse } from "next/server";

/**
 * Liveness Probe.
 * Verifies that the Node.js process is active.
 * Used by Docker Compose and Kubernetes orchestration.
 */
export async function GET() {
  return new NextResponse("OK", {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
