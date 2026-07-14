# JobNest V2 Role-Based Access Control (RBAC) Guide

JobNest V2 enforces granular **Role-Based Access Control (RBAC)** across client components, Server Actions, layouts, and API routes.

---

## 1. System Roles

1.  `super_admin`: Full system control (bypasses all checks).
2.  `admin`: Platform administrators managing users, dispute cases, and system logs.
3.  `moderator`: Community reviewers verifying profiles and audit logs.
4.  `employer`: Business or private recruiters posting local job vacancies.
5.  `worker`: Local job-seekers applying for gigs.
6.  `resident`: Local residents posting home help chores.
7.  `student`: Students searching for nearby internships or part-time work.
8.  `guest`: Unauthenticated anonymous profile (read-only for public listings).

---

## 2. Server Authorization Guards

We utilize the `AuthorizationGuard` class ([lib/authorization/guard.ts](file:///Users/madhu/Desktop/JobNest-dev/lib/authorization/guard.ts)) to secure server-side logic:

### Server Actions
Ensure mutations are protected at the entry point:
```typescript
"use server";

import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";

export async function createJobAction(formData: unknown) {
  // Throws AuthorizationError if user lacks permission
  const userId = await AuthorizationGuard.assertPermission(PERMISSIONS.JOBS_CREATE);
  
  // Proceed with creation
}
```

### Route Handlers (APIs)
```typescript
import { NextResponse } from "next/server";
import { AuthorizationGuard } from "@/lib/authorization/guard";
import { PERMISSIONS } from "@/lib/authorization/permissions";

export async function GET() {
  try {
    await AuthorizationGuard.assertPermission(PERMISSIONS.AUDIT_VIEW);
    return NextResponse.json({ logs: [] });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
```

---

## 3. Client-Side Rendering Guards

Client components should use the `useFeatureFlags` or a context helper to conditionally show/hide UI sections, backed by server-side verification.
*(UI visibility is for user convenience; the server guard must always validate the request).*
