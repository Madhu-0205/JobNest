# JobNest V2 Security Policy Guide

This guide details the security defenses and hardening layers implemented to meet OWASP ASVS guidelines.

---

## 1. Authentication Security

*   **Cookie Hardening**: Supabase Auth sessions are stored in client cookies configured with:
    *   `HttpOnly`: Restricts JavaScript read access, blocking XSS-based token extraction.
    *   `Secure`: Enforces HTTPS transmission.
    *   `SameSite=Lax`: Defends against Cross-Site Request Forgery (CSRF).
*   **Password Policies**: Validated using Zod schemas to guarantee minimum length, casing, digits, and special characters.

---

## 2. API Rate Limiting

To protect authentication endpoints and Server Actions against brute-force credential attacks, we deploy a localized rate-limiting layer:

*   **Rate Limiter ([lib/security/rate-limiter.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/security/rate-limiter.ts))**: Checks request frequencies by IP address or user ID.
*   **Application**:
    ```typescript
    const isLimited = await rateLimiter.isRateLimited(`login:${clientIp}`, 5, 15 * 60 * 1000);
    if (isLimited) {
      throw new Error("Too many authentication attempts. Please try again later.");
    }
    ```

---

## 3. Database Hardening (Row Level Security)

*   **RLS Policies**: Restricts access so users can only access their own records.
*   **Privilege Separation**: Database connections default to `authenticated` or `anon` roles. Only the Server Admin wrapper utilizes the root `service_role` key.
*   **SQL Injection**: Enforced by parameterized queries using PostgreSQL drivers (`pg` and Supabase PostgREST client).

---

## 4. Input & Output Processing

*   **Strict Types**: Avoids the use of `any` types. Input shapes are validated against schemas at runtime.
*   **Next.js Native Escaping**: React escapes rendered variables by default, protecting against Cross-Site Scripting (XSS).
