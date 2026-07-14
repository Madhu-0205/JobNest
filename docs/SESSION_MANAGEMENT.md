# JobNest V2 Session Management Guide

This document describes the session architecture implemented in Phase 2.

---

## 1. Enterprise Session Lifecycle

User sessions are secured through a multi-tiered layer:

1.  **Transport Security**: Sessions are tied to HTTPS-only cookies.
2.  **Short-Lived Access Tokens**: Supabase JWT access tokens expire after 1 hour, reducing vulnerability windows.
3.  **Automatic Refresh**: The Next.js Edge proxy refreshes the access token using the refresh token if the session is still active.
4.  **Revocation**: When a session is marked `is_revoked = true` in the `sessions` table, the user is signed out.

---

## 2. Device Tracking & Analytics

Every authenticated session is mapped to a specific user device record in the database:

*   **Registration ([features/auth/sessions.ts](file:///Users/madhu/Desktop/JobNest-dev/features/auth/sessions.ts))**: Combines user agent strings with client IP addresses.
*   **Attributes tracked**:
    *   `device_type`: Desktop, Mobile, or Tablet.
    *   `os`: operating system (macOS, Windows, iOS, Android, Linux).
    *   `browser`: Browser application (Chrome, Safari, Firefox, Edge).
    *   `last_active_at`: Timestamp updated on request activity.

---

## 3. Session Revocation (Security Actions)

Users can manage and revoke active sessions from their account settings:

```typescript
// Revoke single session
await SessionManager.revokeSession(sessionId);

// Revoke all other logged-in devices
await SessionManager.revokeAllOtherSessions(userId, currentSessionId);
```
This terminates those sessions, requiring re-authentication.
