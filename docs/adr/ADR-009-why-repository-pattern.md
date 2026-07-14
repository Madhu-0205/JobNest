# ADR-009: Adopting the Repository Pattern

## Status
Accepted

## Context
Directly importing DB drivers or ORM clients (e.g. Prisma, Supabase client) into controllers or UI actions creates tight coupling. If database providers or client schemas change, extensive rewrites are required.

## Decision
We chose the **Repository Pattern** as our data access abstraction.

## Consequences
*   **Decoupled Logic**: Business services and Server Actions interact solely with repository interfaces (`lib/domain/repository.ts`).
*   **Easy Mocking**: We can swap in-memory mock repositories (`tests/mocks/`) during unit and integration testing without database instances.
*   **Flexibility**: Allows switching the underlying data source (e.g., from memory mock to real PostgreSQL) without altering UI components.
