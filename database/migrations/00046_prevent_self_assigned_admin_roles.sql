-- Migration 00046: Prevent self-assigned administrative roles upon user signup
-- Prevents privilege escalation where arbitrary client metadata could assign admin/super_admin roles.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_role_id UUID;
    target_role VARCHAR;
BEGIN
    -- Extract desired role from signup metadata, but strictly allow only non-administrative public roles.
    target_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'worker'));
    
    -- Whitelist allowable public registration roles. Administrative and privileged roles are strictly forbidden.
    IF target_role NOT IN ('worker', 'employer', 'resident', 'student') THEN
        target_role := 'worker';
    END IF;
    
    SELECT id INTO default_role_id FROM public.roles WHERE name = target_role;
    IF default_role_id IS NULL THEN
        SELECT id INTO default_role_id FROM public.roles WHERE name = 'worker';
    END IF;

    -- 1. Create public profile
    INSERT INTO public.profiles (
        id,
        display_name,
        username,
        email,
        phone,
        status,
        verification_status
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(md5(random()::text), 1, 10)),
        NEW.email,
        NEW.phone,
        'active',
        'unverified'
    );

    -- 2. Create user preferences defaults
    INSERT INTO public.user_preferences (
        user_id,
        theme,
        notifications_email,
        notifications_push,
        notifications_sms
    ) VALUES (
        NEW.id,
        'dark',
        TRUE,
        TRUE,
        FALSE
    );

    -- 3. Assign role (strictly non-administrative)
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, default_role_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
