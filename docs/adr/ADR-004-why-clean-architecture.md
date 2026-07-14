# ADR-004: Adopting Clean Architecture

## Status
Accepted

## Context
As JobNest grows, the code must remain modular and testable. Couplings to specific database systems, ORMs, or frameworks must not leak into the business logic.

## Decision
We chose **Clean Architecture** as our primary structuring guideline.

## Consequences
*   **Separation of Concerns**: Core domain rules reside in the innermost layer (`lib/domain/`), completely decoupled from Next.js routing or Supabase client APIs.
*   **Testability**: Enables mocking database and network services in tests.
*   **Maintainability**: Framework upgrades (e.g. Next.js major releases) will not affect core business rules.
