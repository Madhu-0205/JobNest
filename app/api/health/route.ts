import { NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceCheck {
  status: "ok" | "degraded" | "down";
  latencyMs?: number;
  message?: string;
}

interface HealthPayload {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: {
    database: ServiceCheck;
    memory: ServiceCheck;
    environment: ServiceCheck;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function checkMemory(): ServiceCheck {
  const used = process.memoryUsage();
  const heapUsedMb = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMb = Math.round(used.heapTotal / 1024 / 1024);
  const utilisation = heapUsedMb / heapTotalMb;

  if (utilisation > 0.95) {
    return { status: "down", message: `Heap exhausted: ${heapUsedMb}/${heapTotalMb} MB` };
  }
  if (utilisation > 0.80) {
    return { status: "degraded", message: `Heap high: ${heapUsedMb}/${heapTotalMb} MB` };
  }
  return { status: "ok", message: `${heapUsedMb}/${heapTotalMb} MB` };
}

function checkEnvironment(): ServiceCheck {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    return { status: "down", message: `Missing: ${missing.join(", ")}` };
  }
  return { status: "ok" };
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
    if (!supabaseUrl) return { status: "down", message: "No Supabase URL configured" };

    // Lightweight health probe — validates the URL is reachable
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "HEAD",
      headers: { apikey: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "" },
      signal: AbortSignal.timeout(3000),
    });

    const latencyMs = Date.now() - start;

    if (!res.ok && res.status !== 401) {
      return { status: "degraded", latencyMs, message: `HTTP ${res.status}` };
    }
    return { status: "ok", latencyMs };
  } catch (err) {
    return {
      status: "down",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET() {
  const [dbCheck, memCheck, envCheck] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkEnvironment()),
  ]);

  const checks = { database: dbCheck, memory: memCheck, environment: envCheck };
  const statuses = Object.values(checks).map((c) => c.status);

  let overallStatus: HealthPayload["status"] = "healthy";
  if (statuses.includes("down")) overallStatus = "unhealthy";
  else if (statuses.includes("degraded")) overallStatus = "degraded";

  const payload: HealthPayload = {
    status: overallStatus,
    version: process.env["npm_package_version"] ?? "0.0.0",
    environment: process.env.NODE_ENV ?? "unknown",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    checks,
  };

  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(payload, { status: httpStatus });
}
