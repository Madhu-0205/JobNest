# JobNest V2 Database Guide

This document describes the PostgreSQL foundation and identity schema details for JobNest V2.

---

## 1. Selected Extensions

To support hyperlocal features and security compliance, the database initializes four extensions:

*   `uuid-ossp`: Enables generating standard V4 UUID keys.
*   `pgcrypto`: Provides cryptographic hashes and random generation algorithms.
*   `postgis`: Adds support for spatial and geographic coordinates, crucial for hyperlocal matching.
*   `vector` (pgvector): Enables vector embeddings for AI semantic profile matching.

---

## 2. Core Identity Database Schema

The Phase 2 schema includes only identity, preferences, and session-related tables:

```
           [auth.users] (Supabase Auth)
                │
         ┌──────┼────────────────────────┐
         │      │                        │
         ▼      ▼                        ▼
    [profiles] [user_roles] ──► [roles] [user_preferences]
                │
                ▼
      [role_permissions] ──► [permissions]
```

*   `profiles`: Stores basic user details. Bound 1-to-1 with `auth.users(id)`.
*   `roles` & `permissions` & `role_permissions`: Core RBAC data models.
*   `user_roles`: Maps users to specific roles.
*   `user_preferences`: Configures themes and notification defaults.
*   `devices` & `sessions`: Tracks active logins and client IPs/User Agents.
*   `audit_logs`: Central ledger recording row mutations.

---

## 3. High Performance Indexes

To support rapid query execution, specialized indexes are declared:

*   `idx_profiles_username`: Unique index for profile searches.
*   `idx_user_roles_user` & `idx_role_permissions_role`: Optimizes permission resolution during page loads.
*   `idx_sessions_token`: Enhances token lookups on session verification.
*   `idx_audit_logs_timestamp`: Speeds up admin dashboard audit history feeds.
