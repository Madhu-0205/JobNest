/**
 * Smoke test: Platform Endpoints
 *
 * Verifies key domain dashboard pages are reachable and API auth guards
 * function correctly (i.e. rejecting requests without credentials).
 *
 * Run: npx tsx tests/smoke/auth.test.ts
 */

const BASE_URL = process.env["TEST_BASE_URL"] ?? "http://localhost:3000";

interface TestCase {
  name: string;
  path: string;
  method?: string;
  body?: Record<string, unknown>;
  expectedStatuses: number[];
  validateBody?: (body: unknown) => void;
}

const PLATFORM_SMOKE_TESTS: TestCase[] = [
  {
    name: "Landing page reachable",
    path: "/",
    method: "GET",
    expectedStatuses: [200],
  },
  {
    name: "Admin dashboard page reachable",
    path: "/admin",
    method: "GET",
    expectedStatuses: [200],
  },
  {
    name: "Trust & Safety dashboard page reachable",
    path: "/trust",
    method: "GET",
    expectedStatuses: [200],
  },
  {
    name: "Realtime operations dashboard page reachable",
    path: "/realtime",
    method: "GET",
    expectedStatuses: [200],
  },
  {
    name: "Financial dashboard page reachable",
    path: "/financial",
    method: "GET",
    expectedStatuses: [200],
  },
  {
    name: "Geospatial dashboard page reachable",
    path: "/geospatial",
    method: "GET",
    expectedStatuses: [200],
  },
  {
    name: "AI intelligence dashboard page reachable",
    path: "/ai",
    method: "GET",
    expectedStatuses: [200],
  },
  {
    name: "Presence API rejects unauthorized requests",
    path: "/api/realtime/presence",
    method: "POST",
    body: { status: "online" },
    expectedStatuses: [400, 401, 403],
    validateBody: (body: unknown) => {
      const typed = body as { success: boolean; error?: { code: string } };
      if (typed.success !== false) {
        throw new Error("Expected API response to indicate failure");
      }
    },
  },
];

async function runTest(tc: TestCase): Promise<void> {
  console.info(`\n🔍 ${tc.name}`);

  const url = `${BASE_URL}${tc.path}`;
  const init: RequestInit = {
    method: tc.method ?? "GET",
    redirect: "manual",
    headers: { "Content-Type": "application/json" },
  };

  if (tc.body) {
    init.body = JSON.stringify(tc.body);
  }

  const res = await fetch(url, init);

  if (!tc.expectedStatuses.includes(res.status)) {
    throw new Error(
      `${tc.name}: Expected status in [${tc.expectedStatuses.join(", ")}], got ${res.status}`
    );
  }

  if (tc.validateBody) {
    const body = await res.json();
    tc.validateBody(body);
  }

  console.info(`✅ ${tc.name}: HTTP ${res.status}`);
}

// ─── Runner ────────────────────────────────────────────────────────────────────

(async () => {
  console.info(`\n🔐 Platform Domain Smoke Tests — ${BASE_URL}\n`);
  let exitCode = 0;

  for (const tc of PLATFORM_SMOKE_TESTS) {
    try {
      await runTest(tc);
    } catch (err) {
      console.error(`\n❌ FAILED: ${tc.name}`);
      console.error(err instanceof Error ? err.message : err);
      exitCode = 1;
    }
  }

  console.info(`\n${exitCode === 0 ? "✅ All platform smoke tests passed" : "❌ Some platform smoke tests failed"}`);
  process.exit(exitCode);
})();
