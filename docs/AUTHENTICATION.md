# JobNest V2 Authentication Guide

This document describes the enterprise authentication architecture implemented in Phase 2.

---

## 1. Supabase Auth Integration

We use **Supabase Auth** for identity management. The architecture separates client-side rendering (CSR) and server-side operations (SSR) securely:

*   **Browser Client ([lib/supabase/client.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/supabase/client.ts))**: Used inside React Client Components for interactive events (e.g. subscribing to auth state changes).
*   **Server Client ([lib/supabase/server.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/supabase/server.ts))**: Instantiated inside Next.js layouts, Server Components, and Server Actions. It reads and writes cookies directly using Next.js `next/headers`.
*   **Admin Client ([lib/supabase/admin.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/supabase/admin.ts))**: A high-privilege server client configured with `SUPABASE_SERVICE_ROLE_KEY`. It bypasses Row Level Security (RLS). Used only for critical administrative tasks (e.g. permanent user account deletion).

---

## 2. Server Actions mutations

Data mutations are handled via Next.js Server Actions, which return type-safe, serializable JSON envelopes:

*   `signUpAction`: Validates parameters using Zod schemas, hashes passwords client-side/server-side, and signs up the user in Supabase.
*   `signInAction`: Authenticates email and password.
*   `signOutAction`: Revokes session tokens.
*   `forgotPasswordAction` & `updatePasswordAction`: Manages email recovery links and updating credentials.
*   `updateEmailAction`: Triggers validation steps for email change requests.

---

## 3. Session Synchronization & Token Refresh

Next.js App Router relies on middleware to refresh tokens:

*   **Request Proxy ([proxy.ts](file:///Users/madhu/Desktop/JobNest-dev/proxy.ts))**: Intercepts requests and invokes the session refresher.
*   **Cookie Sync ([lib/supabase/middleware.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/supabase/middleware.ts))**: Invokes `supabase.auth.getUser()`. If the access token has expired, Supabase automatically fetches a new one using the refresh token, and updates Next.js response cookies.

---

## 4. Future OAuth Integrations

The system is prepared for third-party OAuth providers:

```typescript
// To enable Google OAuth inside Server Actions in Phase 3:
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  },
});
```

*   **Callback Handler**: A Route Handler at `/api/auth/callback` will exchange the authorization code for a session token, automatically triggering the database sync triggers.
