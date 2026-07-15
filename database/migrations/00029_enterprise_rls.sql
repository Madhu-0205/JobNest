-- Migration: Enterprise RLS Policies

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

-- Support: users see own tickets, admins see all
CREATE POLICY "Users read own tickets" ON public.support_tickets
    FOR SELECT TO authenticated USING (requester_id = auth.uid() OR assigned_to = auth.uid() OR public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Users create own tickets" ON public.support_tickets
    FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Admins manage tickets" ON public.support_tickets
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Ticket participants read messages" ON public.support_messages
    FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.requester_id = auth.uid() OR t.assigned_to = auth.uid()))
        OR public.is_moderator_or_admin(auth.uid())
    );
CREATE POLICY "Admins manage messages" ON public.support_messages
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- Moderation: admins/moderators only
CREATE POLICY "Admins manage moderation queue" ON public.moderation_queue
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Admins manage moderation notes" ON public.moderation_notes
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- Fraud: admins only
CREATE POLICY "Admins manage fraud cases" ON public.fraud_cases
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Admins manage fraud events" ON public.fraud_case_events
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- Analytics: admins only
CREATE POLICY "Admins read analytics" ON public.analytics_snapshots
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Admins read metrics" ON public.business_metrics
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- Widgets: users manage own
CREATE POLICY "Users manage own widgets" ON public.dashboard_widgets
    FOR ALL TO authenticated USING (user_id = auth.uid());

-- Settings: admins only
CREATE POLICY "Admins manage settings" ON public.system_settings
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Admins manage feature flags" ON public.feature_flag_overrides
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- Notifications: users read own
CREATE POLICY "Users read own notifications" ON public.system_notifications
    FOR SELECT TO authenticated USING (target_user_id = auth.uid() OR target_user_id IS NULL);
CREATE POLICY "Admins manage notifications" ON public.system_notifications
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- Reports: users read own, admins see all
CREATE POLICY "Users read own reports" ON public.report_exports
    FOR SELECT TO authenticated USING (requested_by = auth.uid() OR public.is_moderator_or_admin(auth.uid()));
CREATE POLICY "Admins manage reports" ON public.report_exports
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));
