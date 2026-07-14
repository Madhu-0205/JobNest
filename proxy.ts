import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Enterprise HTTP Request Lifecycle Proxy (Next.js Middleware).
 * - Injects Correlation IDs and Request IDs
 * - Standardizes headers for tracecontext propagation
 * - Synchronizes and refreshes Supabase Auth session cookies
 */
export async function proxy(request: NextRequest) {
  const correlationId = request.headers.get("x-correlation-id") || crypto.randomUUID();
  const requestId = crypto.randomUUID();

  // Create mutable request headers copy
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-correlation-id", correlationId);
  requestHeaders.set("x-request-id", requestId);

  // Set W3C Traceparent header standard
  requestHeaders.set("traceparent", `00-${correlationId}-${requestId.slice(0, 16)}-01`);

  const initialResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Sync Supabase Auth cookies
  const response = await updateSession(request, initialResponse);

  // Expose correlation identifiers back in response headers for client tracing
  response.headers.set("x-correlation-id", correlationId);
  response.headers.set("x-request-id", requestId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Apply to all paths except assets, images, and static routes
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)",
  ],
};
