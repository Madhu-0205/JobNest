import { NextResponse } from "next/server";
import { AIProviderService } from "@/services/ai-provider-service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceCheck {
  status: "ok" | "degraded" | "down";
  latencyMs?: number;
  message?: string;
}

interface HealthPayload {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  commitSha: string;
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
  aiProvider: string;
  checks: {
    database: ServiceCheck;
    memory: ServiceCheck;
    environment: ServiceCheck;
    aiProvider: ServiceCheck;
    paymentGateway: ServiceCheck;
    realtime: ServiceCheck;
  };
}

// ─── Check Implementations ────────────────────────────────────────────────────

function checkMemory(): ServiceCheck {
  const used = process.memoryUsage();
  const heapUsedMb = Math.round(used.heapUsed / 1024 / 1024);
  const heapTotalMb = Math.round(used.heapTotal / 1024 / 1024);
  const utilisation = heapUsedMb / heapTotalMb;

  if (utilisation > 0.95) return { status: "down", message: `Heap exhausted: ${heapUsedMb}/${heapTotalMb} MB` };
  if (utilisation > 0.80) return { status: "degraded", message: `Heap high: ${heapUsedMb}/${heapTotalMb} MB` };
  return { status: "ok", message: `${heapUsedMb}/${heapTotalMb} MB` };
}

function checkEnvironment(): ServiceCheck {
  const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) return { status: "down", message: `Missing: ${missing.join(", ")}` };
  return { status: "ok" };
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
    if (!supabaseUrl) return { status: "down", message: "No Supabase URL configured" };

    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "HEAD",
      headers: { apikey: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "" },
      signal: AbortSignal.timeout(3000),
    });

    const latencyMs = Date.now() - start;
    if (!res.ok && res.status !== 401 && res.status !== 403) return { status: "degraded", latencyMs, message: `HTTP ${res.status}` };
    return { status: "ok", latencyMs };
  } catch (err) {
    return { status: "down", latencyMs: Date.now() - start, message: err instanceof Error ? err.message : "Unknown error" };
  }
}

function checkAIProvider(): ServiceCheck {
  try {
    // Resolve the provider name — throws if misconfigured in production
    const provider = AIProviderService.getProviderName();
    // Validate that required API keys are present for cloud providers
    if (provider === "gemini" && !process.env["GEMINI_API_KEY"]) {
      return { status: "degraded", message: "AI_PROVIDER=gemini but GEMINI_API_KEY is not set" };
    }
    if (provider === "openai" && !process.env["OPENAI_API_KEY"]) {
      return { status: "degraded", message: "AI_PROVIDER=openai but OPENAI_API_KEY is not set" };
    }
    if (provider === "ollama" && process.env.NODE_ENV === "production") {
      return { status: "down", message: "Ollama is not supported in production" };
    }
    return { status: "ok", message: `provider=${provider}` };
  } catch (err) {
    return { status: "down", message: err instanceof Error ? err.message : "AI provider misconfigured" };
  }
}

async function checkPaymentGateway(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];

    if (!keyId || !keySecret) {
      return { status: "degraded", message: "Razorpay credentials not configured" };
    }
    if (keyId.startsWith("mock") || keySecret.startsWith("mock")) {
      return { status: "degraded", message: "Using mock Razorpay credentials (not production-ready)" };
    }

    // Lightweight probe: list orders with page_size=1 to validate credentials
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders?count=1", {
      headers: { Authorization: `Basic ${auth}` },
      signal: AbortSignal.timeout(3000),
    });

    const latencyMs = Date.now() - start;
    if (res.status === 401) return { status: "down", latencyMs, message: "Invalid Razorpay credentials" };
    if (!res.ok) return { status: "degraded", latencyMs, message: `Razorpay API HTTP ${res.status}` };
    return { status: "ok", latencyMs };
  } catch (err) {
    return {
      status: "degraded",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Payment gateway unreachable",
    };
  }
}

async function checkRealtime(): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"];
    if (!supabaseUrl) return { status: "down", message: "No Supabase URL configured" };

    // Probe the Supabase Realtime endpoint
    const realtimeUrl = supabaseUrl.replace("https://", "https://").replace(".supabase.co", ".supabase.co") + "/realtime/v1/";
    const res = await fetch(realtimeUrl, {
      method: "HEAD",
      headers: { apikey: process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] ?? "" },
      signal: AbortSignal.timeout(3000),
    });

    const latencyMs = Date.now() - start;
    // Realtime returns 200, 401, 403 (auth required) or 426 (Upgrade Required for WS) — all mean the service is up
    if (res.status === 200 || res.status === 401 || res.status === 403 || res.status === 426) {
      return { status: "ok", latencyMs };
    }
    return { status: "degraded", latencyMs, message: `Realtime HTTP ${res.status}` };
  } catch (err) {
    return {
      status: "degraded",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Realtime unreachable",
    };
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET() {
  const [dbCheck, paymentCheck, realtimeCheck] = await Promise.all([
    checkDatabase(),
    checkPaymentGateway(),
    checkRealtime(),
  ]);

  const checks = {
    database: dbCheck,
    memory: checkMemory(),
    environment: checkEnvironment(),
    aiProvider: checkAIProvider(),
    paymentGateway: paymentCheck,
    realtime: realtimeCheck,
  };

  const statuses = Object.values(checks).map((c) => c.status);
  let overallStatus: HealthPayload["status"] = "healthy";
  if (statuses.includes("down")) overallStatus = "unhealthy";
  else if (statuses.includes("degraded")) overallStatus = "degraded";

  const activeProvider = (() => {
    try { return AIProviderService.getProviderName(); } catch { return "unknown"; }
  })();

  const payload: HealthPayload = {
    status: overallStatus,
    version: process.env["npm_package_version"] ?? "0.0.0",
    commitSha: process.env["COMMIT_SHA"] ?? "unknown",
    environment: process.env.NODE_ENV ?? "unknown",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    aiProvider: activeProvider,
    checks,
  };

  return NextResponse.json(payload, { status: overallStatus === "unhealthy" ? 503 : 200 });
}
