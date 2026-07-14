# JobNest V2 Database Migrations Guide

This guide details the custom transactional migration system developed in Phase 2.

---

## 1. Directory Structure

All database scripts reside under `database/`:

*   `database/migrations/`: Sequential `.sql` migration files.
*   `database/seed.sql`: Script to populate default roles and permission sets.
*   `database/migrate.ts`: TypeScript migration executor script.

---

## 2. Migration Execution

Migrations are applied sequentially using:

```bash
npm run db:migrate
```
*(This triggers `npx tsx database/migrate.ts` in the package scripts).*

### Runner Lifecycle Flow:
1.  Connects to the database using `DATABASE_URL`.
2.  Creates the `_migrations` history table if missing.
3.  Compares files in `database/migrations/` with applied logs.
4.  Applies missing scripts inside individual SQL transactions (`BEGIN` ... `COMMIT`). If a script fails, it automatically rolls back (`ROLLBACK`).
5.  Applies seed configurations from `seed.sql`.

---

## 3. Creating a New Migration

To append database tables (e.g. `jobs` table in Phase 3):

1.  Create a new file in `database/migrations/` following the naming format:
    `database/migrations/00006_create_jobs_table.sql`
2.  Add table schemas, indexes, and RLS commands.
3.  Run `npm run db:migrate` to verify it applies successfully.
