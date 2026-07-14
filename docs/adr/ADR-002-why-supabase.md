# ADR-002: Selection of Supabase as Backend-as-a-Service (BaaS)

## Status
Accepted (Phase 2+)

## Context
JobNest V2 requires secure user authentication, multi-factor login support, relational database connectivity, static file storage (resumes, avatars), and real-time event synchronization.

Building these core utilities from scratch would delay time-to-market.

## Decision
We chose **Supabase** as our backend integration partner.

## Consequences
*   **Authentication**: Built-in OAuth, magic link, and OTP logins, reducing vulnerability risks.
*   **Storage**: Automated S3-compatible asset buckets with CDN optimization.
*   **Real-time Synchronization**: WebSockets-driven listeners for chat integrations.
