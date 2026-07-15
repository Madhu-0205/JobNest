-- Migration: Enterprise Triggers

-- Auto-compute SLA deadline on ticket creation based on priority
CREATE OR REPLACE FUNCTION public.compute_ticket_sla()
RETURNS TRIGGER AS $$
BEGIN
    NEW.sla_deadline_at := CASE NEW.priority
        WHEN 'critical' THEN NEW.created_at + INTERVAL '1 hour'
        WHEN 'urgent' THEN NEW.created_at + INTERVAL '4 hours'
        WHEN 'high' THEN NEW.created_at + INTERVAL '8 hours'
        WHEN 'medium' THEN NEW.created_at + INTERVAL '24 hours'
        WHEN 'low' THEN NEW.created_at + INTERVAL '72 hours'
        ELSE NEW.created_at + INTERVAL '24 hours'
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_compute_ticket_sla
    BEFORE INSERT ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.compute_ticket_sla();

-- Auto-update timestamps on moderation queue changes
CREATE OR REPLACE FUNCTION public.update_moderation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    IF NEW.status IN ('approved', 'rejected') AND OLD.status NOT IN ('approved', 'rejected') THEN
        NEW.resolved_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_moderation_timestamp
    BEFORE UPDATE ON public.moderation_queue
    FOR EACH ROW EXECUTE FUNCTION public.update_moderation_timestamp();

-- Auto-update fraud case timestamps
CREATE OR REPLACE FUNCTION public.update_fraud_case_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fraud_case_timestamp
    BEFORE UPDATE ON public.fraud_cases
    FOR EACH ROW EXECUTE FUNCTION public.update_fraud_case_timestamp();
