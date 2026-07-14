import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "@/config/env";

/**
 * Enterprise Session Refresher.
 * Refreshes auth sessions by syncing cookies between Next.js Edge proxy and Supabase Auth.
 */
export async function updateSession(request: NextRequest, response: NextResponse): Promise<NextResponse> {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url === "https://mock.supabase.co" || anonKey === "mock-anon-key") {
    // Gracefully bypass if mock configurations are active (e.g. in basic testing)
    return response;
  }

  let supabaseResponse = response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Calling getUser triggers session token refresh if access token expired
  await supabase.auth.getUser();

  return supabaseResponse;
}
