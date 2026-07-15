# JobNest V2 — Production Checklist

Run through this checklist before every production deployment.

---

## Infrastructure

- [ ] Docker image built and tagged with commit SHA
- [ ] `docker/Dockerfile` uses pinned base image (not `:latest`)
- [ ] Docker `HEALTHCHECK` passes: `docker inspect --format='{{.State.Health.Status}}' jobnest-app`
- [ ] `docker-compose.prod.yml` resource limits reviewed
- [ ] Nginx TLS certificate is valid and not expiring within 30 days
- [ ] Nginx rate limiting rules are active

---

## Environment

- [ ] All `[REQUIRED]` variables in `.env.example` are set in production
- [ ] `npm run validate:env` exits with code 0
- [ ] `METRICS_SECRET` is set and is at least 32 characters
- [ ] `NODE_ENV=production` is set
- [ ] No `.env.local` file is present on the production server
- [ ] Secrets are stored in a secrets manager, not in shell history or files

---

## Database

- [ ] All database migrations have been applied: `npm run db:migrate`
- [ ] Supabase backup is recent (within last 24 hours)
- [ ] Database connection string uses PgBouncer (connection pooling) in production
- [ ] Row Level Security (RLS) is enabled on all user-facing tables
- [ ] Supabase service role key is server-side only (not in `NEXT_PUBLIC_*`)

---

## Security

- [ ] `npm run security:audit` passes with no high/critical vulnerabilities
- [ ] CSP header (`Content-Security-Policy`) is present and strict
- [ ] HSTS header (`Strict-Transport-Security`) includes `preload`
- [ ] `X-Frame-Options: DENY` is set
- [ ] All API routes validate input (Zod schemas)
- [ ] Auth middleware protects all `/dashboard/**` routes
- [ ] Supabase Auth email confirmations are enabled

---

## Observability

- [ ] `/api/health` returns `"status": "healthy"`
- [ ] `/api/metrics` is accessible with the correct `METRICS_SECRET`
- [ ] Uptime monitor is configured (e.g., Uptime Robot / Better Uptime)
- [ ] Log aggregator is collecting application logs
- [ ] At least one alert is set for health check failures

---

## Application

- [ ] `npm run build` exits with zero warnings
- [ ] `npm run typecheck` exits clean
- [ ] `npm run lint` exits clean
- [ ] `npm run test:smoke` passes against the production URL
- [ ] `npm run test:integration` passes against the production URL
- [ ] All feature flags are set to the correct values for production
- [ ] AI API keys are configured and within quota limits

---

## Performance

- [ ] Next.js `output: "standalone"` is set
- [ ] Image optimization is enabled (`formats: ["image/avif", "image/webp"]`)
- [ ] Static assets are cached at the Nginx layer
- [ ] Cache adapter is in `redis` mode (Upstash configured) or `memory` with sufficient limits

---

## Documentation

- [ ] `CHANGELOG.md` / release notes updated
- [ ] README reflects current architecture
- [ ] All environment variables are documented in `.env.example`

---

## Post-Deployment

- [ ] Health check passes: `npm run health:check`
- [ ] Login flow works end-to-end
- [ ] At least one critical user journey has been manually verified
- [ ] Application version is visible in `/api/health` response
- [ ] Deployment is tagged in Git: `git tag v$(cat package.json | jq -r .version)`

---

*Last reviewed: Phase 11 — Production Readiness*
