# JobNest V2 — Monitoring Guide

Production monitoring strategy for platform observability.

---

## Architecture Overview

```
JobNest App
  │
  ├── /api/health        → Liveness & readiness probes
  ├── /api/metrics       → Prometheus-compatible text metrics
  └── Structured JSON logs → Log aggregator
```

---

## 1. Health Endpoint

**URL:** `GET /api/health`

Returns a JSON health report. Use this for:
- Docker `HEALTHCHECK` (already configured in `docker/Dockerfile`)
- Load balancer health probe
- Uptime monitoring (Uptime Robot, Better Uptime, etc.)

### Response schema

```json
{
  "status": "healthy | degraded | unhealthy",
  "version": "0.1.0",
  "environment": "production",
  "timestamp": "2026-07-15T12:00:00.000Z",
  "uptimeSeconds": 3600,
  "checks": {
    "database": { "status": "ok", "latencyMs": 12 },
    "memory": { "status": "ok", "message": "128/512 MB" },
    "environment": { "status": "ok" }
  }
}
```

### Alerting thresholds

| Check | Condition | Alert |
|-------|-----------|-------|
| HTTP | `status != 200` | P0 |
| `status` | `"unhealthy"` | P0 |
| `status` | `"degraded"` | P1 |
| `database.latencyMs` | `> 500` | P1 |
| `memory.status` | `"degraded"` | P2 |

---

## 2. Prometheus Metrics

**URL:** `GET /api/metrics`  
**Auth:** `x-metrics-secret: $METRICS_SECRET` (production only)

Configure Prometheus to scrape this endpoint:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: jobnest
    scrape_interval: 15s
    scheme: https
    static_configs:
      - targets: ['yourdomain.com']
    metrics_path: /api/metrics
    params:
      token: ['your-metrics-secret']
```

### Key metrics

| Metric | Type | Description |
|--------|------|-------------|
| `nodejs_heap_size_used_bytes` | Gauge | Current heap usage |
| `nodejs_heap_size_total_bytes` | Gauge | Total heap allocated |
| `nodejs_rss_bytes` | Gauge | Resident Set Size |
| `process_uptime_seconds` | Gauge | Time since last restart |
| `jobnest_build_info` | Gauge | Build metadata (version, env) |

---

## 3. Structured Logging

JobNest emits JSON logs to stdout. Collect with Loki, Datadog, or CloudWatch.

### Log format

```json
{
  "level": "info",
  "timestamp": "2026-07-15T12:00:00.000Z",
  "service": "jobnest-api",
  "traceId": "abc123",
  "message": "Request completed",
  "path": "/api/jobs",
  "method": "GET",
  "statusCode": 200,
  "durationMs": 45
}
```

### Log levels

| Level | Use |
|-------|-----|
| `debug` | Detailed dev info (dev only) |
| `info` | Normal operations |
| `warn` | Degraded but recoverable |
| `error` | Actionable failures |

Configure via `LOG_LEVEL` env var.

---

## 4. Recommended Alerts

### Uptime Robot / Better Uptime

| Monitor | Type | Interval | Alert when |
|---------|------|----------|-----------|
| Health check | HTTP | 1 min | Non-200 response |
| Homepage | HTTP | 5 min | Non-200 response |

### Prometheus / Grafana

```promql
# Memory usage > 80%
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes > 0.8

# App restarted in last 5 minutes
increase(process_uptime_seconds[5m]) < 0

# Health endpoint down
up{job="jobnest"} == 0
```

---

## 5. Distributed Tracing (Optional)

The platform emits W3C `traceparent` headers via `lib/observability/otel.ts`.

To enable full tracing:
1. Set `OTEL_EXPORTER_OTLP_ENDPOINT` to your collector URL
2. Set `OTEL_SERVICE_NAME=jobnest-api`
3. Use Jaeger, Tempo, or Honeycomb as the backend

---

## 6. Error Tracking (Optional)

Integrate Sentry for error tracking:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Set `SENTRY_DSN` in your environment after setup.

---

## Related Docs

- [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
