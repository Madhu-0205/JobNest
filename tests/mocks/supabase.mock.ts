/**
 * Generic mock implementation of Supabase Client.
 * Designed to be generic and runnable by any test runner (Jest, Vitest, Bun).
 * Serves as the foundation testing adapter for database operations.
 */
export const createMockSupabase = () => {
  return {
    auth: {
      signUp: async (_credentials: { email: string }) => ({
        data: { user: { id: "mock-user-id", email: _credentials.email } },
        error: null,
      }),
      signInWithPassword: async (_credentials: { email: string }) => ({
        data: { session: { access_token: "mock-token", user: { id: "mock-user-id", email: _credentials.email } } },
        error: null,
      }),
      signOut: async () => ({ error: null }),
    },
    from: (_table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { id: "mock-id", name: "Mock Entry" }, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
      insert: async (_data: unknown) => ({ data: { id: "new-mock-id" }, error: null }),
    }),
  };
};
