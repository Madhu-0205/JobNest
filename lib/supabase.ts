import { env } from "@/config/env";

/**
 * Supabase client builder placeholder.
 * This acts as an extension point for database & storage interactions in future phases.
 */
export const getSupabaseClient = () => {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url === "https://mock.supabase.co" || anonKey === "mock-anon-key") {
    // In production, force correct environment configuration.
    if (env.NODE_ENV === "production") {
      throw new Error(
        "Supabase credentials are not configured. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    
    // Graceful mock logger for development
    return {
      auth: {
        signUp: async () => { throw new Error("Supabase Auth is not implemented yet in Phase 1."); },
        signInWithPassword: async () => { throw new Error("Supabase Auth is not implemented yet in Phase 1."); },
      },
      from: (_table: string) => ({
        select: () => { throw new Error("Supabase DB operations are not implemented yet in Phase 1."); },
      }),
      storage: {
        from: (bucket: string) => ({
          upload: async (path: string, file: File) => {
            console.warn(`Mock upload of ${file.name} to ${bucket}/${path}`);
            return { data: { path }, error: null };
          },
        }),
      },
    };
  }

  // Future phase integration placeholder:
  // import { createClient } from "@supabase/supabase-js";
  // return createClient(url, anonKey);
  
  return {
    url,
    anonKey,
    storage: {
      from: (_bucket: string) => ({
        upload: async (path: string, _file: File) => {
          return { data: { path }, error: null };
        },
      }),
    },
  };
};
export type SupabaseClient = ReturnType<typeof getSupabaseClient>;
