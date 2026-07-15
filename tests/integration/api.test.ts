/**
 * Integration test: Core API contracts
 *
 * Tests that key API routes respond with the expected content type,
 * status codes, and structural schema. Does not require a database.
 *
 * Run: npx tsx tests/integration/api.test.ts
 */

const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
let passed = 0;
let failed = 0;

// ─── Micro test harness ────────────────────────────────────────────────────────

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.info(`  ✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertIn<T>(value: T, allowed: T[], field: string): void {
  if (!allowed.includes(value)) {
    throw new Error(`${field}: expected one of [${allowed.join(", ")}], got "${value}"`);
  }
}

// ─── API Tests ─────────────────────────────────────────────────────────────────

async function runHealthTests(): Promise<void> {
  console.info("\n📋 /api/health");

  await test("returns 200 or 503", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assertIn(res.status, [200, 503], "HTTP status");
  });

  await test("returns JSON content-type", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const ct = res.headers.get("content-type") ?? "";
    assert(ct.includes("application/json"), `content-type is ${ct}`);
  });

  await test("response contains required fields", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const body = await res.json() as Record<string, unknown>;
    const required = ["status", "timestamp", "uptimeSeconds", "checks"];
    for (const field of required) {
      assert(field in body, `missing field: ${field}`);
    }
  });

  await test("uptime is a positive number", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const body = await res.json() as { uptimeSeconds: number };
    assert(typeof body.uptimeSeconds === "number", "uptimeSeconds is not a number");
    assert(body.uptimeSeconds > 0, "uptimeSeconds should be > 0");
  });
}

async function runMetricsTests(): Promise<void> {
  console.info("\n📋 /api/metrics");

  await test("returns 200 or 403", async () => {
    const res = await fetch(`${BASE_URL}/api/metrics`);
    assertIn(res.status, [200, 403], "HTTP status");
  });

  await test("returns OpenMetrics content-type when accessible", async () => {
    const res = await fetch(`${BASE_URL}/api/metrics`);
    if (res.status === 200) {
      const ct = res.headers.get("content-type") ?? "";
      assert(ct.includes("text/plain"), `content-type should be text/plain, got: ${ct}`);
    }
  });

  await test("contains node.js heap metric when accessible", async () => {
    const res = await fetch(`${BASE_URL}/api/metrics`);
    if (res.status === 200) {
      const text = await res.text();
      assert(
        text.includes("nodejs_heap_size_used_bytes"),
        "Missing nodejs_heap_size_used_bytes metric"
      );
    }
  });
}

async function runSecurityHeaderTests(): Promise<void> {
  console.info("\n📋 Security Headers");

  await test("X-Frame-Options: DENY is set", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const val = res.headers.get("x-frame-options");
    assert(val === "DENY", `x-frame-options is "${val}"`);
  });

  await test("X-Content-Type-Options: nosniff is set", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const val = res.headers.get("x-content-type-options");
    assert(val === "nosniff", `x-content-type-options is "${val}"`);
  });

  await test("Content-Security-Policy is present", async () => {
    const res = await fetch(`${BASE_URL}/`);
    const val = res.headers.get("content-security-policy");
    assert(!!val, "Content-Security-Policy header is missing");
    assert(val!.includes("default-src"), "CSP missing default-src directive");
  });

  await test("Strict-Transport-Security is set", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const val = res.headers.get("strict-transport-security");
    assert(!!val, "HSTS header is missing");
    assert(val!.includes("max-age"), "HSTS missing max-age directive");
  });
}

// ─── Runner ────────────────────────────────────────────────────────────────────

(async () => {
  console.info(`\n🧪 Integration Tests — ${BASE_URL}`);

  await runHealthTests();
  await runMetricsTests();
  await runSecurityHeaderTests();

  const total = passed + failed;
  console.info(`\n${"─".repeat(50)}`);
  console.info(`Results: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ""}`);

  if (failed > 0) {
    console.error("\n❌ Integration tests failed");
    process.exit(1);
  } else {
    console.info("\n✅ All integration tests passed");
  }
})();
