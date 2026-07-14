# ADR-010: Coding Standards & Quality Gates

## Status
Accepted

## Context
Codebase scale requires strict engineering standards to ensure readability, security, and maintainability.

## Decision
We defined unified quality gates and coding rules.

## Consequences
*   **TypeScript Strict**: Compilers block implicit `any` usage. Path aliases (`@/*`) must resolve all imports from the root.
*   **Zero Warnings Policy**: Production compilation (`npm run build`) and linting (`npm run lint`) must resolve with zero warnings and errors.
*   **Formatting Rules**: Enforced automatically via Prettier and pre-commit Husky git hooks.
*   **Error Logging**: Every error must be typed using custom error classes (`lib/errors.ts`) and registered with correlation identifiers.
