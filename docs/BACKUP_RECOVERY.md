# JobNest V2 — Backup & Recovery Guide

---

## 1. What to Back Up

| Asset | Criticality | Backup Strategy |
|-------|-------------|-----------------|
| Supabase PostgreSQL database | **Critical** | Supabase built-in + pg_dump |
| Supabase Storage (files) | High | Supabase backups + S3 sync |
| Environment variables / secrets | **Critical** | Secrets manager |
| Application code | High | Git / GitHub |
| Docker images | Medium | Container registry |

---

## 2. Database Backups

### 2.1 Supabase Built-in Backups

Supabase automatically backs up your database:
- **Free plan:** 7-day point-in-time recovery (PITR)
- **Pro plan:** 30-day PITR, daily snapshots
- **Enterprise:** Custom retention

Access via: Supabase Dashboard → Project → Database → Backups

### 2.2 Manual pg_dump Backups

```bash
# Full database dump
pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-acl \
  --no-owner \
  -f "backup-$(date +%Y%m%d-%H%M%S).dump"

# Compress and upload to S3
gzip backup-*.dump
aws s3 cp backup-*.dump.gz s3://your-backup-bucket/jobnest/db/
```

**Recommended schedule:** Daily automated cron via GitHub Actions or a server-side cron job.

### 2.3 Schema-only Backup

```bash
pg_dump "$DATABASE_URL" --schema-only -f schema-$(date +%Y%m%d).sql
```

---

## 3. Storage Backups

Supabase Storage is backed up as part of the Supabase backup system.

For additional protection:

```bash
# Sync Supabase storage to S3 using rclone
rclone sync supabase-storage:your-project-id s3:your-backup-bucket/storage/ \
  --progress \
  --log-file backup.log
```

---

## 4. Secrets Backup

**Never** store secrets in Git. Use one of:

- **AWS Secrets Manager** — versioned, audited
- **Google Secret Manager** — IAM-controlled
- **HashiCorp Vault** — self-hosted option
- **Doppler** — developer-friendly SaaS

Export a local encrypted backup of secrets:

```bash
# Export from Doppler
doppler secrets download --no-file --format env > secrets.env
gpg --symmetric --cipher-algo AES256 secrets.env
# Store secrets.env.gpg in secure offline storage
```

---

## 5. Recovery Procedures

### 5.1 Restore Database from Supabase PITR

1. Go to Supabase Dashboard → Database → Backups
2. Select the target point in time
3. Click "Restore"
4. Wait for restoration (typically 5–30 minutes)
5. Run health check: `npm run health:check`

### 5.2 Restore from pg_dump

```bash
# Download backup from S3
aws s3 cp s3://your-backup-bucket/jobnest/db/backup-20260715.dump.gz .
gunzip backup-20260715.dump.gz

# Restore (drops existing connections)
pg_restore \
  --dbname "$DATABASE_URL" \
  --no-acl \
  --no-owner \
  --clean \
  backup-20260715.dump
```

### 5.3 Restore Environment Variables

```bash
# Decrypt secrets backup
gpg --decrypt secrets.env.gpg > secrets.env

# Load into production environment (example: Doppler)
doppler secrets upload secrets.env
```

---

## 6. Recovery Time Objectives

| Scenario | RTO | RPO |
|----------|-----|-----|
| App container crash | < 2 min | 0 (stateless) |
| Database corruption | < 1 hour | < 24 hours |
| Full infrastructure loss | < 4 hours | < 24 hours |
| Secret compromise | < 30 min | 0 (rotate immediately) |

---

## 7. Backup Verification

Run monthly restore tests:

```bash
# Restore to a staging database
pg_restore --dbname "$STAGING_DATABASE_URL" backup-latest.dump

# Validate row counts
psql "$STAGING_DATABASE_URL" -c "
SELECT
  schemaname,
  tablename,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
LIMIT 20;"
```

---

## Related Docs

- [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
