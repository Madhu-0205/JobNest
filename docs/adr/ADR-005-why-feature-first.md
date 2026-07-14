# ADR-005: Adopting Feature-First Directory Layout

## Status
Accepted

## Context
Standard Next.js setups group all hooks in `hooks/`, all pages in `app/`, and all components in `components/`. As the project scales, developers must cross-reference multiple folders to modify a single feature.

## Decision
We chose a **Feature-First Layout** for business logic.

## Consequences
*   **Locality of Reference**: Components, hooks, types, and logic relating to a single domain reside together (e.g. `features/job-matching/`).
*   **Decoupled Modules**: Promotes cleaner APIs between independent features.
*   **Shared Foundation**: Common elements (e.g., UI primitives) remain under central directories (`components/ui/`, `lib/`).
