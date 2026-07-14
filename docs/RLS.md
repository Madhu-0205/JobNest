# JobNest V2 Row Level Security (RLS) Guide

Every table in JobNest V2 has **Row Level Security (RLS)** enabled, enforcing a "deny by default" security posture.

---

## 1. Core Policies Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | Active / Owner / Admin | Owner | Owner / Admin | Admin |
| `user_preferences` | Owner / Admin | Owner | Owner / Admin | - |
| `devices` | Owner / Admin | Owner | Owner / Admin | Owner / Admin |
| `sessions` | Owner / Admin | Owner | Owner / Admin | Owner / Admin |
| `roles` | Authenticated | Admin | Admin | Admin |
| `permissions` | Authenticated | Admin | Admin | Admin |
| `role_permissions` | Authenticated | Admin | Admin | Admin |
| `user_roles` | Owner / Admin | Admin | Admin | Admin |
| `audit_logs` | Admin | system-only | - | - |

---

## 2. Preventing Infinite Recursion

Directly querying `user_roles` inside RLS policies on other tables can cause recursive evaluation loops if the `user_roles` table itself has RLS enabled.

To resolve this, we use two specialized database helper functions:
1.  `public.has_role(user_id, role_name)`
2.  `public.is_admin(user_id)`

These functions are marked as `SECURITY DEFINER`. This tells PostgreSQL to execute the function body using the permissions of the database owner (bypassing RLS checks on `user_roles`), preventing circular loops.

---

## 3. Creating Custom Policies

When adding new tables (e.g. `jobs` in Phase 3), always apply this format:

```sql
-- 1. Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 2. Define Least-Privilege Policies
CREATE POLICY select_jobs ON public.jobs
  FOR SELECT USING (status = 'published');

CREATE POLICY insert_jobs ON public.jobs
  FOR INSERT WITH CHECK (
    auth.uid() = employer_id AND 
    public.has_role(auth.uid(), 'employer')
  );
```
