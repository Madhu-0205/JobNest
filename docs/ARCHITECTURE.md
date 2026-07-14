# JobNest V2 Architecture & Project Guide

Welcome to **JobNest Version 2**, an enterprise-grade, hyperlocal gig-work and job marketplace. This document describes the architecture, coding standards, development workflows, and deployment preparations built into the Phase 1 Foundation.

---

## 1. Architectural Principles

JobNest is built on three core software engineering pillars: **Decoupling, Testability, and Type-Safety**.

### App Router Architecture
Next.js 15 App Router is leveraged for optimized page rendering, static site generation (SSG), server-side rendering (SSR), and streaming layouts. Code splitting is handled automatically on a route-by-route basis.

### Clean Architecture & Separations of Concerns
The project structure enforces strict separation between layers:
*   **UI Layer** (`components/ui/`): Highly reusable, state-agnostic primitive components (e.g. Buttons, Inputs, Cards) adhering to accessibility standards (WCAG AA).
*   **Service Layer** (`services/`): Decoupled business logic modules (e.g. Logger, API clients) written as classes or stateless namespaces, allowing easy mock injections during tests.
*   **Feature-First Layer** (`features/`): Directory structure grouping route-specific components, state, hooks, and types together (e.g. `features/jobs`, `features/chat` in later phases).
*   **State & Providers** (`providers/`): Application-wide React Context wrappers.

### Dependency Injection & Extension Hooks
All third-party integrations (Supabase, Razorpay, Ollama) are built behind service adapter patterns (`lib/supabase.ts`). This ensures the app compiles and runs in isolation without external database requirements during testing and CI phases.

---

## 2. Folder Structure

The project root layout is organized as follows:

```
├── .github/workflows/   # CI/CD Action pipelines
├── .husky/              # Git hooks (pre-commit, commit-msg)
├── .vscode/             # VSCode workspace configurations
├── app/                 # Next.js page routes, layouts, and API handlers
│   ├── api/             # REST endpoints (e.g., health check)
│   └── globals.css      # Core tailwind import
├── components/          # Shared layout & UI components
│   └── ui/              # Atom-level primitives (Buttons, Cards, Dialogs)
├── config/              # Runtime & environment configurations
├── docs/                # Architecture and deployment guides
├── docker/              # Dockerfile and Docker Compose resources
├── features/            # Feature-first modules (auth, jobs, chat - Phase 2+)
├── hooks/               # Custom React hooks
├── lib/                 # Core client libraries (Supabase, Stripe - adapters)
├── providers/           # Theme and state context wrappers
├── services/            # Business services (logger, validation, geolocation)
├── styles/              # Global theme tokens, typography, and classes
├── types/               # Globally shared TypeScript declarations
├── utils/               # Decoupled utility helper functions
└── tests/               # Unit, integration, and E2E specs
```

---

## 3. Coding Standards & Naming Conventions

### TypeScript Strict
*   No `any` values are allowed.
*   Strict null checks are enabled in `tsconfig.json`.
*   All function inputs and outputs must define explicit types or interfaces.
*   Ensure zero typescript compiler errors or linter warnings prior to pushing.

### Naming Conventions
*   **Directories**: Kebab-case (e.g. `components/ui`, `features/job-matching`).
*   **React Components**: PascalCase (e.g. `Button.tsx`, `PageHeader.tsx`).
*   **Hooks**: CamelCase prefixed with `use` (e.g. `useTheme.ts`).
*   **Services, Utilities & Configs**: CamelCase (e.g. `logger.ts`, `cn.ts`).
*   **TypeScript Types/Interfaces**: PascalCase, descriptive names (e.g. `LogLevel`, `ButtonProps`).
*   **Styles & Classnames**: Kebab-case in CSS; Tailwind classes in components.

---

## 4. Git Workflow & Conventional Commits

We use **Conventional Commits** to keep the history clean and automate releases.

### Commit Format
```
<type>(<scope>): <description>

[optional body]
```

### Supported Types
*   `feat`: A new user-facing feature.
*   `fix`: A bug fix.
*   `docs`: Documentation changes only.
*   `style`: Code style changes (whitespace, formatting, missing semi-colons).
*   `refactor`: Code changes that neither fix bugs nor add features.
*   `perf`: Performance optimizations.
*   `test`: Adding or correcting tests.
*   `chore`: Maintain scripts, build configurations, or dependencies.

### Commit Verification
Commit linting is run automatically on commit message submission via Husky and `@commitlint/cli`. Code is formatted and linted prior to commit via `lint-staged`.

---

## 5. Environment Management

Environment variables are validated on application startup using **Zod**. The schema definition resides in [config/env.ts](file:///Users/madhu/Desktop/JobNest-dev/config/env.ts).

### Setting Up Local Variables
1.  Copy `.env.example` into a local file:
    ```bash
    cp .env.example .env
    ```
2.  Modify the values to match your local setup.
3.  The application will fail to start if required keys are missing or formatted incorrectly.

---

## 6. Deployment & Docker Configuration

The application is prepared for enterprise containerized deployments.

### Local Docker Build & Test
1.  Build the image locally:
    ```bash
    docker-compose -f docker/docker-compose.yml build
    ```
2.  Launch the container in detached mode:
    ```bash
    docker-compose -f docker/docker-compose.yml up -d
    ```
3.  Check container health:
    ```bash
    docker ps
    ```
    The container will execute a health check against `/api/health` and verify state transitions.
