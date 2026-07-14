import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

/**
 * Creates a server-side Supabase Admin Client.
 * Leverages the high-privilege Service Role Key to bypass RLS policies.
 * WARNING: NEVER expose this client to the browser.
 */
export const createAdminClient = () => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey || url === "https://mock.supabase.co" || serviceRoleKey === "mock-service-role-key") {
    throw new Error("Supabase admin credentials are not configured. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
