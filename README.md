# JobNest - Version 2

> Connecting skilled locals with nearby opportunities.

JobNest is an enterprise-grade, AI-powered hyperlocal job marketplace connecting workers, freelancers, students, businesses, and local residents. 

This repository contains **JobNest Version 2**, rebuilt from scratch with correctness, scalability, security, and clean architecture as primary objectives.

---

## 🚀 Phase 1 Foundation Stack

*   **Frontend Framework**: Next.js 15 (App Router) & React 19
*   **Language**: TypeScript (Strict Mode)
*   **Styling**: Tailwind CSS v4 & custom design tokens
*   **Component Architecture**: Accessible WCAG AA Radix UI Primitives & custom class merges (`clsx` + `tailwind-merge`)
*   **Validation**: Zod
*   **Tooling & Git hooks**: Husky, Lint-staged, Commitlint, ESLint, Prettier
*   **Infrastructure**: Multi-stage Docker, Docker Compose, GitHub Actions (CI pipelines)

---

## 📂 Project Organization

Refer to [docs/ARCHITECTURE.md](file:///Users/madhu/Desktop/JobNest-dev/docs/ARCHITECTURE.md) for full folder explanations and naming standards.

---

## 🛠️ Getting Started

### Prerequisites

*   Node.js (v20+)
*   NPM (v10+)
*   Docker (Optional, for containerized verification)

### Installation

1.  Clone the repository and install dependencies:
    ```bash
    npm install
    ```

2.  Copy and set up environment variables:
    ```bash
    cp .env.example .env
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Performance Features

*   **Content-Security-Policy (CSP)**: Foundational strict CSP configured inside Next.js headers config.
*   **HSTS & HTTP Headers**: Enforced HSTS, X-Frame-Options (DENY), and Referrer Policies.
*   **Environment Validation**: Zod-parsed configurations evaluated on boot.
*   **Docker Standalone Build**: Leverages Next.js output tracing to reduce final container footprint under 150MB.
