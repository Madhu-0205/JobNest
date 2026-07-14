# ADR-001: Selection of Next.js 15 (App Router)

## Status
Accepted

## Context
JobNest V2 is a hyperlocal marketplace connecting workers and employers. The platform requires high visual fidelity, fast initial page loads, dynamic search engine indexing (SEO), and low-latency interaction.

We evaluated traditional Single Page Applications (e.g. Vite-bundled React) vs Server-Side Rendered framework (Next.js) vs Mobile Hybrid solutions.

## Decision
We chose **Next.js 15 (App Router)** as our primary development framework.

## Consequences
*   **Performance**: Automatic code splitting and Server-Side Rendering (SSR) optimize Largest Contentful Paint (LCP) and visual metrics.
*   **SEO Optimization**: Next.js App Router metadata API dynamically maps crawlable page details, vital for local SEO (nearby gig indexing).
*   **Full Stack Integration**: Unifies client-side interactivity with backend Server Actions and API endpoints in a single container deployment.
