-- Migration: 00042_hardening_indexes.sql
-- Description: Phase 12 Final Production Hardening Indexes

-- ── 1. Realtime & Chat ────────────────────────────────────────────────────────
-- Optimize getting chat rooms where a user is either employer or worker
CREATE INDEX IF NOT EXISTS idx_chat_rooms_employer 
  ON public.chat_rooms (employer_id);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_worker 
  ON public.chat_rooms (worker_id);

-- ── 2. Opportunities ──────────────────────────────────────────────────────────
-- Optimize mode switching and category filtering (Local vs Pro)
CREATE INDEX IF NOT EXISTS idx_opportunities_type_category 
  ON public.opportunities (type_id, category_id);

-- ── 3. Connections & Networking ───────────────────────────────────────────────
-- Optimize querying a user's professional network graph
CREATE INDEX IF NOT EXISTS idx_connections_requester 
  ON public.connections (requester_id, status);

CREATE INDEX IF NOT EXISTS idx_connections_recipient 
  ON public.connections (recipient_id, status);

CREATE INDEX IF NOT EXISTS idx_follows_follower 
  ON public.follows (follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_target_id 
  ON public.follows (target_id);

-- ── 4. Organizations ──────────────────────────────────────────────────────────
-- Ownership is mapped via organization_members

CREATE INDEX IF NOT EXISTS idx_organization_members_org
  ON public.organization_members (organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_members_user
  ON public.organization_members (user_id);
