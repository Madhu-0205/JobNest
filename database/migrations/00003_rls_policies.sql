-- Enable Row Level Security (RLS) on every table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create helper function to check role memberships safely (Bypasses RLS recursively using SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, role_name VARCHAR)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1 AND r.name = $2
    );
END;
$$ LANGUAGE plpgsql;

-- Create helper function to check if the user is an admin or super admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN SECURITY DEFINER AS $$
BEGIN
    RETURN public.has_role($1, 'admin') OR public.has_role($1, 'super_admin');
END;
$$ LANGUAGE plpgsql;

-- 1. POLICIES FOR public.roles
CREATE POLICY select_roles ON public.roles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY manage_roles ON public.roles FOR ALL USING (public.is_admin(auth.uid()));

-- 2. POLICIES FOR public.permissions
CREATE POLICY select_permissions ON public.permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY manage_permissions ON public.permissions FOR ALL USING (public.is_admin(auth.uid()));

-- 3. POLICIES FOR public.role_permissions
CREATE POLICY select_role_permissions ON public.role_permissions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY manage_role_permissions ON public.role_permissions FOR ALL USING (public.is_admin(auth.uid()));

-- 4. POLICIES FOR public.user_roles
CREATE POLICY select_user_roles ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY manage_user_roles ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- 5. POLICIES FOR public.profiles
CREATE POLICY select_profiles ON public.profiles FOR SELECT USING (status = 'active' OR auth.uid() = id OR public.is_admin(auth.uid()));
CREATE POLICY insert_profiles ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY update_profiles ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin(auth.uid())) WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- 6. POLICIES FOR public.user_preferences
CREATE POLICY select_preferences ON public.user_preferences FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY insert_preferences ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_preferences ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid())) WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 7. POLICIES FOR public.devices
CREATE POLICY select_devices ON public.devices FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY insert_devices ON public.devices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_devices ON public.devices FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid())) WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY delete_devices ON public.devices FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 8. POLICIES FOR public.sessions
CREATE POLICY select_sessions ON public.sessions FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY insert_sessions ON public.sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY update_sessions ON public.sessions FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid())) WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY delete_sessions ON public.sessions FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 9. POLICIES FOR public.audit_logs
CREATE POLICY select_audit_logs ON public.audit_logs FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY insert_audit_logs ON public.audit_logs FOR INSERT WITH CHECK (TRUE); -- Allow system writes
