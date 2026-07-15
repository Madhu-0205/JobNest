# JobNest V2 — Operations Runbook

Operational procedures for on-call engineers and platform administrators.

---

## 1. Service Health Check

```bash
# Quick health probe
curl -sf https://yourdomain.com/api/health | jq .

# Full smoke tests
TEST_BASE_URL=https://yourdomain.com npm run test:smoke
```

**Expected states:**

| Status | HTTP | Meaning |
|--------|------|---------|
| `healthy` | 200 | All systems nominal |
| `degraded` | 200 | Partial service; monitor closely |
| `unhealthy` | 503 | Service disruption; escalate |

---

## 2. Restart Procedures

### Restart the application container

```bash
docker compose -f docker/docker-compose.prod.yml restart app
```

### Restart Nginx

```bash
docker compose -f docker/docker-compose.prod.yml restart nginx
```

### Restart entire stack

```bash
docker compose -f docker/docker-compose.prod.yml down
docker compose -f docker/docker-compose.prod.yml up -d
```

---

## 3. Log Access

```bash
# Live application logs
npm run docker:logs

# Last 500 lines
docker compose -f docker/docker-compose.prod.yml logs --tail=500 app

# Nginx access logs
docker compose -f docker/docker-compose.prod.yml logs nginx

# Search for errors in the last hour
docker compose -f docker/docker-compose.prod.yml logs app \
  --since 1h | grep -i '"level":"error"'
```

---

## 4. Metrics

```bash
# Prometheus text metrics (requires METRICS_SECRET in production)
curl -H "x-metrics-secret: $METRICS_SECRET" https://yourdomain.com/api/metrics

# Key metrics to monitor:
#   nodejs_heap_size_used_bytes  — memory usage
#   process_uptime_seconds       — time since last restart
#   jobnest_build_info           — deployed version
```

---

## 5. Common Incidents

### 5.1 — High Memory Usage

**Symptoms:** `memory.status: degraded` or OOM kills in Docker.

**Response:**
1. Check current heap: `curl .../api/health | jq .checks.memory`
2. Review recent deployments for memory leaks
3. Restart app container: `docker compose restart app`
4. If persistent: increase container `mem_limit` in `docker-compose.prod.yml`

---

### 5.2 — Database Unreachable

**Symptoms:** `database.status: down` in health check.

**Response:**
1. Verify Supabase status: https://status.supabase.com
2. Check `NEXT_PUBLIC_SUPABASE_URL` in production env
3. Test connectivity: `curl -I $NEXT_PUBLIC_SUPABASE_URL/rest/v1/`
4. Check Supabase dashboard for connection limits / rate limits

---

### 5.3 — Application Won't Start

**Symptoms:** Container exits immediately; `docker ps` shows `Exited`.

**Response:**
```bash
# View exit reason
docker compose -f docker/docker-compose.prod.yml logs app --tail=50

# Common causes:
# 1. Missing env vars → npm run validate:env
# 2. Port conflict → lsof -i :3000
# 3. Bad build → npm run docker:build and retry
```

---

### 5.4 — Nginx 502 Bad Gateway

**Symptoms:** Users see 502; Nginx running but app is not.

**Response:**
1. Check app container: `docker compose ps app`
2. Restart: `docker compose restart app`
3. Check health: `curl http://localhost:3000/api/health`

---

### 5.5 — Elevated Error Rate

**Symptoms:** 5xx spike in Nginx logs.

**Response:**
```bash
# Count 5xx in last 5 minutes
docker logs jobnest-nginx 2>&1 | grep -c '"status":5'

# Identify the offending paths
docker logs jobnest-app 2>&1 | grep '"level":"error"' | \
  jq -r '.path' | sort | uniq -c | sort -rn | head -20
```

---

## 6. Scaling

### Horizontal (multiple app replicas)

```bash
docker compose -f docker/docker-compose.prod.yml up -d --scale app=3
```

Ensure the load balancer (Nginx upstream) is configured for multiple backends.

### Vertical (resource limits)

Edit `docker/docker-compose.prod.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: "2"
      memory: 2G
```

---

## 7. Emergency Rollback

See [RELEASE_PROCESS.md](./RELEASE_PROCESS.md#rollback).

---

## 8. Escalation

| Severity | Response Time | Owner |
|----------|--------------|-------|
| P0 — Production down | 15 min | On-call Engineer |
| P1 — Degraded service | 1 hour | Engineering Team |
| P2 — Non-critical bug | Next business day | Product Team |
