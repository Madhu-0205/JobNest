/**
 * Prometheus-compatible metrics endpoint.
 *
 * Exposes runtime metrics in the OpenMetrics text exposition format.
 * Secured: only callable from internal networks or with the METRICS_SECRET
 * header in production.
 *
 * Route: GET /api/metrics
 */

import { NextRequest, NextResponse } from "next/server";

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorised(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const secret = process.env["METRICS_SECRET"];
  if (!secret) return false;

  const provided =
    req.headers.get("x-metrics-secret") ??
    req.nextUrl.searchParams.get("token");

  return provided === secret;
}

// ─── Metric helpers ───────────────────────────────────────────────────────────

function gauge(name: string, help: string, value: number, labels: Record<string, string> = {}): string {
  const labelStr =
    Object.keys(labels).length > 0
      ? `{${Object.entries(labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(",")}}`
      : "";
  return `# HELP ${name} ${help}\n# TYPE ${name} gauge\n${name}${labelStr} ${value}\n`;
}

function counter(name: string, help: string, value: number): string {
  return `# HELP ${name} ${help}\n# TYPE ${name} counter\n${name}_total ${value}\n`;
}

// ─── Metric collectors ────────────────────────────────────────────────────────

function collectNodeMetrics(): string {
  const mem = process.memoryUsage();
  const lines: string[] = [];

  lines.push(gauge("nodejs_heap_size_used_bytes", "Process heap used in bytes", mem.heapUsed));
  lines.push(gauge("nodejs_heap_size_total_bytes", "Process heap total in bytes", mem.heapTotal));
  lines.push(gauge("nodejs_external_memory_bytes", "External memory in bytes", mem.external));
  lines.push(gauge("nodejs_rss_bytes", "Resident Set Size in bytes", mem.rss));
  lines.push(gauge("process_uptime_seconds", "Process uptime in seconds", process.uptime()));

  return lines.join("\n");
}

function collectPlatformMetrics(): string {
  const lines: string[] = [];
  const env = process.env.NODE_ENV ?? "unknown";
  const version = process.env["npm_package_version"] ?? "0.0.0";

  lines.push(
    gauge(
      "jobnest_build_info",
      "JobNest build metadata",
      1,
      { version, environment: env, service: "jobnest-api" }
    )
  );

  lines.push(counter("jobnest_health_checks", "Total health check requests served", 0));
  lines.push(gauge("jobnest_feature_flags_active", "Number of active feature flags", 0));

  return lines.join("\n");
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = [
    "# JobNest Platform Metrics",
    `# Generated: ${new Date().toISOString()}`,
    "",
    collectNodeMetrics(),
    collectPlatformMetrics(),
  ].join("\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
