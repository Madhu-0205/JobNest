-- Migration: 00034_performance_indexes.sql
-- Description: High-concurrency performance indexes for JobNest core tables

-- ── 1. Opportunities & Applications ───────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_opportunities_status_created 
  ON public.opportunities (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_opportunities_employer 
  ON public.opportunities (employer_id);

CREATE INDEX IF NOT EXISTS idx_applications_opportunity 
  ON public.applications (opportunity_id);

CREATE INDEX IF NOT EXISTS idx_applications_worker 
  ON public.applications (worker_id);

-- ── 2. Financial Ledger & Payments ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_order 
  ON public.payments (order_id);

CREATE INDEX IF NOT EXISTS idx_payments_user 
  ON public.payments (user_id);

CREATE INDEX IF NOT EXISTS idx_escrow_opportunity 
  ON public.escrow_holdings (opportunity_id);

-- ── 3. Realtime Messaging & Presence ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created 
  ON public.chat_messages (room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_presence_user 
  ON public.presence_heartbeats (user_id, last_seen DESC);
