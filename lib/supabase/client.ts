import { createBrowserClient as createBrowserClientSsr } from "@supabase/ssr";

/**
 * Creates a client-side Supabase browser client.
 * For use in React Client Components.
 */
export const createBrowserClient = () => {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const anonKey = process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!url || !anonKey || url === "https://mock.supabase.co" || anonKey === "mock-anon-key") {
    throw new Error("Supabase public credentials are not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createBrowserClientSsr(url, anonKey);
};
