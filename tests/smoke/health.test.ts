/**
 * Smoke test: Health endpoint
 *
 * Verifies that the /api/health route is reachable and returns the expected
 * schema. Runs against the locally running dev server.
 *
 * Run: npx tsx tests/smoke/health.test.ts
 */

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";

interface HealthResponse {
  status: string;
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: { status: string; latencyMs?: number };
    memory: { status: string; message?: string };
    environment: { status: string };
  };
}

async function testHealthEndpoint(): Promise<void> {
  console.info(`\n🔍 [health.test] Probing ${BASE_URL}/api/health`);

  const res = await fetch(`${BASE_URL}/api/health`);

  // ── Status code ────────────────────────────────────────────────────────────
  if (res.status !== 200 && res.status !== 503) {
    throw new Error(`Unexpected HTTP status: ${res.status}`);
  }

  const body = (await res.json()) as HealthResponse;

  // ── Schema validation ──────────────────────────────────────────────────────
  const required: (keyof HealthResponse)[] = [
    "status",
    "version",
    "environment",
    "timestamp",
    "uptimeSeconds",
    "checks",
  ];

  for (const field of required) {
    if (!(field in body)) {
      throw new Error(`Missing field in health response: ${field}`);
    }
  }

  if (!["healthy", "degraded", "unhealthy"].includes(body.status)) {
    throw new Error(`Invalid health status: ${body.status}`);
  }

  if (!body.checks.database || !body.checks.memory || !body.checks.environment) {
    throw new Error("Missing service checks in health response");
  }

  // ── Timestamp validity ─────────────────────────────────────────────────────
  const ts = new Date(body.timestamp);
  if (isNaN(ts.getTime())) {
    throw new Error(`Invalid timestamp: ${body.timestamp}`);
  }

  const ageMs = Date.now() - ts.getTime();
  if (ageMs > 10_000) {
    throw new Error(`Stale timestamp: ${ageMs}ms old`);
  }

  console.info(`✅ Health: ${body.status} | DB: ${body.checks.database.status} | ` +
    `Memory: ${body.checks.memory.message ?? body.checks.memory.status} | ` +
    `Uptime: ${body.uptimeSeconds}s`);
}

async function testMetricsEndpoint(): Promise<void> {
  console.info(`\n🔍 [health.test] Probing ${BASE_URL}/api/metrics`);

  const res = await fetch(`${BASE_URL}/api/metrics`);

  // In development (no METRICS_SECRET required), should return 200
  if (res.status !== 200 && res.status !== 403) {
    throw new Error(`Unexpected /api/metrics status: ${res.status}`);
  }

  if (res.status === 200) {
    const text = await res.text();
    if (!text.includes("nodejs_heap_size_used_bytes")) {
      throw new Error("Metrics response missing expected nodejs_heap_size_used_bytes metric");
    }
    if (!text.includes("jobnest_build_info")) {
      throw new Error("Metrics response missing jobnest_build_info metric");
    }
    console.info("✅ Metrics endpoint: OK (OpenMetrics format validated)");
  } else {
    console.info("⚠️  Metrics endpoint: 403 (expected in secured environments)");
  }
}

// ─── Runner ────────────────────────────────────────────────────────────────────

(async () => {
  let exitCode = 0;

  const tests: Array<[string, () => Promise<void>]> = [
    ["Health endpoint", testHealthEndpoint],
    ["Metrics endpoint", testMetricsEndpoint],
  ];

  for (const [name, fn] of tests) {
    try {
      await fn();
    } catch (err) {
      console.error(`\n❌ FAILED: ${name}`);
      console.error(err instanceof Error ? err.message : err);
      exitCode = 1;
    }
  }

  console.info(`\n${exitCode === 0 ? "✅ All smoke tests passed" : "❌ Some smoke tests failed"}`);
  process.exit(exitCode);
})();
