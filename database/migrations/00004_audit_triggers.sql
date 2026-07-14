-- Create audit trigger function to capture Row Changes automatically
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id UUID;
    v_correlation_id VARCHAR(255);
    v_ip_address VARCHAR(50);
    v_user_agent TEXT;
    v_headers TEXT;
BEGIN
    -- Safely extract user context from Supabase auth session
    BEGIN
        v_actor_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_actor_id := NULL;
    END;

    -- Extract request details from current session configurations if active
    BEGIN
        v_headers := current_setting('request.headers', true);
        IF v_headers IS NOT NULL AND v_headers <> '' THEN
            v_correlation_id := v_headers::json->>'x-correlation-id';
            v_ip_address := split_part(v_headers::json->>'x-forwarded-for', ',', 1);
            v_user_agent := v_headers::json->>'user-agent';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_correlation_id := NULL;
        v_ip_address := NULL;
        v_user_agent := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (actor_id, action, resource, old_value, new_value, ip_address, user_agent, correlation_id)
        VALUES (v_actor_id, TG_OP, TG_TABLE_NAME, row_to_json(OLD)::jsonb, NULL, v_ip_address, v_user_agent, v_correlation_id);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Only audit if row contents actually changed
        IF OLD IS DISTINCT FROM NEW THEN
            INSERT INTO public.audit_logs (actor_id, action, resource, old_value, new_value, ip_address, user_agent, correlation_id)
            VALUES (v_actor_id, TG_OP, TG_TABLE_NAME, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, v_ip_address, v_user_agent, v_correlation_id);
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (actor_id, action, resource, old_value, new_value, ip_address, user_agent, correlation_id)
        VALUES (v_actor_id, TG_OP, TG_TABLE_NAME, NULL, row_to_json(NEW)::jsonb, v_ip_address, v_user_agent, v_correlation_id);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 1. Attach triggers to core identity tables
CREATE TRIGGER audit_profiles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_user_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER audit_role_permissions_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();
