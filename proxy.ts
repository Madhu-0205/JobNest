import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/config/env";
import { rateLimiter, RateLimitType } from "@/lib/security/rate-limiter";

/**
 * Enterprise HTTP Request Lifecycle Proxy (Next.js Proxy).
 * - Injects Correlation IDs and Request IDs
 * - Standardizes headers for tracecontext propagation
 * - Synchronizes and refreshes Supabase Auth session cookies
 * - Enforces Route Protection and Role-Based Guards
 * - Emits structured JSON access log per request (request_id, correlation_id, route, method, duration_ms)
 */
export async function proxy(request: NextRequest) {
  const startMs = Date.now();
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

  const path = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for") || "unknown-ip";

  // Bot Protection for API routes
  if (path.startsWith("/api/")) {
    const userAgent = request.headers.get("user-agent");
    if (!userAgent) {
      return NextResponse.json({ error: "Forbidden: Missing User-Agent" }, { status: 403 });
    }

    let type: RateLimitType = "search";
    if (path.includes("/ai/")) {
      type = "aiGeneration";
    } else if (path.includes("/admin/")) {
      type = "admin";
    } else if (path.includes("/financial/")) {
      // Differentiate between destructive payment operations vs basic wallet fetching
      if (request.method === "GET") {
        type = "search"; // Standard rate limit
      } else {
        type = "paymentCreation";
      }
    } else if (path.includes("/search")) {
      type = "search";
    }

    const result = await rateLimiter.check(type, ip);
    if (!result.success) {
      const response = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
      response.headers.set("RateLimit-Limit", result.limit.toString());
      response.headers.set("RateLimit-Remaining", result.remaining.toString());
      response.headers.set("RateLimit-Reset", result.reset.toString());
      response.headers.set("Retry-After", Math.ceil((result.reset - Date.now()) / 1000).toString());
      return response;
    }
  }

  // Sync Supabase Auth cookies
  const response = await updateSession(request, initialResponse);

  // Route Protection and Role Guards
  const { pathname } = request.nextUrl;
  
  const roleGuards = [
    { prefix: "/admin", allowedRoles: ["admin"] },
    { prefix: "/trust", allowedRoles: ["admin", "moderator", "trust_moderator"] },
    { prefix: "/financial", allowedRoles: ["admin"] },
    { prefix: "/realtime", allowedRoles: ["admin"] },
    { prefix: "/ai", allowedRoles: ["admin"] },
    { prefix: "/geospatial", allowedRoles: ["admin"] },
    { prefix: "/worker", allowedRoles: ["worker", "admin"] },
    { prefix: "/employer", allowedRoles: ["employer", "admin"] },
    { prefix: "/resident", allowedRoles: ["resident", "admin"] },
  ];

  const matchingGuard = roleGuards.find((guard) => pathname.startsWith(guard.prefix));

  function createRscSafeRedirect(targetPath: string) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = targetPath;
    const res = NextResponse.redirect(redirectUrl);
    const isRsc = request.headers.get("rsc") === "1" || request.nextUrl.searchParams.has("_rsc");
    if (isRsc) {
      res.headers.set("x-next-redirect", redirectUrl.pathname + redirectUrl.search);
    }
    return res;
  }

  if (matchingGuard) {
    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const isMock = !url || !anonKey || url === "https://mock.supabase.co" || anonKey === "mock-anon-key";

    if (isMock) {
      // Missing or mock configuration should fail the request, not silently redirect to /
      return NextResponse.json({ error: "Configuration Error: Supabase credentials are missing or mocked." }, { status: 500 });
    }

    if (!isMock) {
      const supabase = createServerClient(url, anonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {}
        },
      });

      const { data: { user } } = await supabase.auth.getUser();
      
      // Strict Guard: All protected routes REQUIRE an authenticated server user.
      // Client-supplied cookies (jobnest_auth, jobnest_role) MUST NEVER grant access.
      if (!user) {
        return createRscSafeRedirect("/");
      }

      // Authoritative role resolution:
      // Only server-managed app_metadata or the database user_roles table can be trusted.
      // Client-supplied user_metadata or cookies MUST NEVER grant elevated roles.
      let userRole: string = (user.app_metadata?.['role'] as string) || "";
      
      if (!userRole) {
        const { data: dbRole } = await supabase
          .from("user_roles")
          .select("roles:roles ( name )")
          .eq("user_id", user.id)
          .maybeSingle();
        const roleData = dbRole as unknown as { roles: { name: string } | null } | null;
        userRole = roleData?.roles?.name || "worker";
      }

      if (!matchingGuard.allowedRoles.includes(userRole)) {
        return createRscSafeRedirect("/");
      }

      // ASVS: Enforce email verification for protected routes when server user exists
      if (user && !user.email_confirmed_at && user.email) {
        return createRscSafeRedirect("/onboarding/verify");
      }
    }
  }

  // Expose correlation identifiers back in response headers for client tracing
  response.headers.set("x-correlation-id", correlationId);
  response.headers.set("x-request-id", requestId);

  // Structured access log — captured by cloud log aggregators in production
  const durationMs = Date.now() - startMs;
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: "INFO",
    message: `${request.method} ${pathname} (${durationMs}ms)`,
    request_id: requestId,
    correlation_id: correlationId,
    route: pathname,
    method: request.method,
    duration_ms: durationMs,
    env: process.env.NODE_ENV,
  };
  if (process.env.NODE_ENV === "production") {
    console.info(JSON.stringify(logEntry));
  } else {
    console.info(`[${logEntry.timestamp}] [REQ] [${requestId}] ${request.method} ${pathname} (${durationMs}ms)`);
  }

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
