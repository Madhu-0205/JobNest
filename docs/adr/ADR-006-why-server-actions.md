# ADR-006: Selection of Next.js Server Actions for Data Mutations

## Status
Accepted

## Context
JobNest V2 needs a low-latency secure way to execute data mutations (submitting applications, updating profile skills) from client components to the database, without building standard REST routes.

## Decision
We chose **Next.js Server Actions** as the mutation pipeline.

## Consequences
*   **Reduced Boilerplate**: Removes the need to write separate API route files and fetch requests.
*   **Type Safety**: Shares TypeScript models between client forms (using React Hook Form) and server validators (using Zod) out-of-the-box.
*   **Security**: Runs strictly on the server; headers and execution environments are hidden from clients.
