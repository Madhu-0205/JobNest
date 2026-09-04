-- Enable standard security and geo-spatial extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Setup default Supabase roles locally if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role;
    END IF;
END $$;


-- Setup local auth schema if missing (for local development database runs)
-- (Skipped for real Supabase databases where auth schema is managed by supabase_admin)
-- CREATE SCHEMA IF NOT EXISTS auth;
-- CREATE TABLE IF NOT EXISTS auth.users (...);
-- CREATE OR REPLACE FUNCTION auth.uid()...
-- CREATE OR REPLACE FUNCTION auth.role()...
-- CREATE OR REPLACE FUNCTION auth.email()...


