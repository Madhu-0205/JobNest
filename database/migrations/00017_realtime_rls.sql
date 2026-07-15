-- Migration: Realtime Operations Row Level Security Policies (Phase 6)
-- Enable Row Level Security
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_events_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. POLICIES FOR public.chat_rooms
CREATE POLICY select_chat_rooms ON public.chat_rooms FOR SELECT
USING (auth.uid() = employer_id OR auth.uid() = worker_id OR public.is_admin(auth.uid()));

CREATE POLICY insert_chat_rooms ON public.chat_rooms FOR INSERT
WITH CHECK (auth.uid() = employer_id OR auth.uid() = worker_id OR public.is_admin(auth.uid()));

CREATE POLICY update_chat_rooms ON public.chat_rooms FOR UPDATE
USING (auth.uid() = employer_id OR auth.uid() = worker_id OR public.is_admin(auth.uid()));

-- 2. POLICIES FOR public.chat_messages
CREATE POLICY select_chat_messages ON public.chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chat_rooms r
        WHERE r.id = room_id AND (r.employer_id = auth.uid() OR r.worker_id = auth.uid())
    ) OR public.is_admin(auth.uid())
);

CREATE POLICY insert_chat_messages ON public.chat_messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.chat_rooms r
        WHERE r.id = room_id AND (r.employer_id = auth.uid() OR r.worker_id = auth.uid())
    ) OR public.is_admin(auth.uid())
);

CREATE POLICY update_chat_messages ON public.chat_messages FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.chat_rooms r
        WHERE r.id = room_id AND (r.employer_id = auth.uid() OR r.worker_id = auth.uid())
    ) OR public.is_admin(auth.uid())
);

-- 3. POLICIES FOR public.live_tracking
-- Workers view their own, Employers view tracking details if there is an active shortlist/offer/accepted application
CREATE POLICY select_live_tracking ON public.live_tracking FOR SELECT
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.applications a
        JOIN public.opportunities o ON a.opportunity_id = o.id
        WHERE a.worker_id = user_id AND o.employer_id = auth.uid() AND a.status IN ('shortlisted', 'offered', 'accepted')
    ) OR
    public.is_admin(auth.uid())
);

CREATE POLICY manage_live_tracking ON public.live_tracking FOR ALL
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 4. POLICIES FOR public.realtime_events_queue
CREATE POLICY manage_realtime_events_queue ON public.realtime_events_queue FOR ALL
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 5. POLICIES FOR public.realtime_audit_logs
CREATE POLICY select_realtime_audit_logs ON public.realtime_audit_logs FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY insert_realtime_audit_logs ON public.realtime_audit_logs FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Triggers for audit logging via the central public.process_audit_log() trigger function
CREATE TRIGGER audit_chat_rooms_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.chat_rooms
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_chat_messages_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
