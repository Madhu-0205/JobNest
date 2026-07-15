# JobNest V2 — Deployment Guide

This guide covers deploying JobNest to production using Docker Compose with Nginx.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Docker | ≥ 24.0 |
| Docker Compose | ≥ 2.20 |
| Node.js | ≥ 20 LTS (for local builds) |
| A Supabase project | Any plan |

---

## 1. Environment Setup

```bash
# Clone the repo
git clone https://github.com/your-org/jobnest.git
cd jobnest

# Copy and fill in the environment template
cp .env.example .env.local

# Validate your environment before deploying
npm run validate:env
```

All `[REQUIRED]` variables in `.env.example` must be set. See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for field-by-field guidance.

---

## 2. Build the Docker Image

```bash
# Production build
npm run docker:build

# Verify the image
docker images | grep jobnest
```

The multi-stage `docker/Dockerfile` produces a minimal standalone image.
Build args are injected automatically — no `.env` is baked into the image.

---

## 3. Deploy with Docker Compose

```bash
# Start the full production stack (Nginx + App)
npm run docker:prod

# Verify all containers are healthy
docker compose -f docker/docker-compose.prod.yml ps

# Tail application logs
npm run docker:logs
```

### Stack components

| Service | Port | Description |
|---------|------|-------------|
| `app` | 3000 (internal) | Next.js standalone server |
| `nginx` | 80, 443 | Reverse proxy + TLS termination |

---

## 4. TLS / SSL Configuration

Nginx is configured to terminate TLS. Before going live:

1. Obtain a certificate (recommended: [Let's Encrypt](https://letsencrypt.org/))
2. Mount the certificate into the nginx container:
   ```yaml
   volumes:
     - /etc/letsencrypt/live/yourdomain.com:/etc/nginx/ssl:ro
   ```
3. Uncomment the `443` server block in `docker/nginx/nginx.conf`

---

## 5. Zero-Downtime Deployments

```bash
# Build the new image
npm run docker:build

# Rolling restart (Compose v2)
docker compose -f docker/docker-compose.prod.yml up -d --no-deps --build app

# Verify health post-deploy
npm run health:check
```

---

## 6. Rollback

```bash
# Tag images by commit SHA during release
docker tag jobnest:latest jobnest:$(git rev-parse --short HEAD)

# Rollback to a specific image
docker compose -f docker/docker-compose.prod.yml stop app
docker tag jobnest:<previous-sha> jobnest:latest
docker compose -f docker/docker-compose.prod.yml up -d app
```

---

## 7. Post-Deployment Verification

```bash
# Health check
curl https://yourdomain.com/api/health | jq .

# Expected response
{
  "status": "healthy",
  "checks": {
    "database": { "status": "ok" },
    "memory": { "status": "ok" },
    "environment": { "status": "ok" }
  }
}
```

Run the full smoke test suite:
```bash
TEST_BASE_URL=https://yourdomain.com npm run test:smoke
```

---

## 8. Database Migrations

```bash
# Run pending migrations against production DB
DATABASE_URL=postgres://... npm run db:migrate
```

Always run migrations **before** deploying a new application version.

---

## Related Docs

- [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md)
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- [RELEASE_PROCESS.md](./RELEASE_PROCESS.md)
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)
