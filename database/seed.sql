-- 1. SEED DEFAULT ROLES
INSERT INTO public.roles (name, description) VALUES
('super_admin', 'System owner with root privileges'),
('admin', 'Platform administrator, manages disputes and users'),
('moderator', 'Content reviewer and profile auditor'),
('employer', 'Users posting hyperlocal jobs and paying workers'),
('worker', 'Gig workers applying for jobs and requesting payouts'),
('resident', 'Local residents looking to post personal chores'),
('student', 'Students applying for local part-time gigs'),
('guest', 'Anonymous viewer of public listings')
ON CONFLICT (name) DO NOTHING;

-- 2. SEED DEFAULT PERMISSIONS
INSERT INTO public.permissions (name, description) VALUES
('jobs:create', 'Create new job postings'),
('jobs:view', 'View job details'),
('jobs:edit', 'Modify owned job postings'),
('jobs:delete', 'Remove job postings'),
('jobs:apply', 'Apply to active job postings'),
('profiles:view', 'Inspect user profile details'),
('profiles:edit_own', 'Modify own profile details'),
('profiles:verify', 'Approve/verify user KYC credentials'),
('wallet:deposit', 'Add funds to wallet balance'),
('wallet:withdraw', 'Request wallet payout'),
('wallet:view', 'Check wallet statements and balance'),
('users:manage', 'Suspend/reactivate users'),
('system:settings', 'Configure global application parameters'),
('audit:view', 'Access system security log feeds')
ON CONFLICT (name) DO NOTHING;

-- 3. LINK ROLES AND PERMISSIONS
-- A. Super Admin mappings (All permissions)
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- B. Admin mappings
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'admin'
AND p.name IN ('jobs:view', 'jobs:delete', 'profiles:view', 'profiles:verify', 'wallet:view', 'users:manage', 'audit:view')
ON CONFLICT DO NOTHING;

-- C. Moderator mappings
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'moderator'
AND p.name IN ('jobs:view', 'jobs:delete', 'profiles:view', 'profiles:verify')
ON CONFLICT DO NOTHING;

-- D. Employer mappings
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'employer'
AND p.name IN ('jobs:create', 'jobs:view', 'jobs:edit', 'profiles:view', 'profiles:edit_own', 'wallet:deposit', 'wallet:view')
ON CONFLICT DO NOTHING;

-- E. Worker mappings
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'worker'
AND p.name IN ('jobs:view', 'jobs:apply', 'profiles:view', 'profiles:edit_own', 'wallet:withdraw', 'wallet:view')
ON CONFLICT DO NOTHING;

-- F. Resident mappings
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'resident'
AND p.name IN ('jobs:create', 'jobs:view', 'profiles:view', 'profiles:edit_own', 'wallet:view')
ON CONFLICT DO NOTHING;

-- G. Student mappings
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'student'
AND p.name IN ('jobs:view', 'jobs:apply', 'profiles:view', 'profiles:edit_own', 'wallet:view')
ON CONFLICT DO NOTHING;

-- H. Guest mappings
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'guest'
AND p.name IN ('jobs:view')
ON CONFLICT DO NOTHING;

-- 4. SEED DEFAULT LANGUAGES
INSERT INTO public.languages (code, name) VALUES
('en', 'English'),
('hi', 'Hindi'),
('te', 'Telugu'),
('ta', 'Tamil'),
('kn', 'Kannada'),
('ml', 'Malayalam'),
('mr', 'Marathi'),
('gu', 'Gujarati'),
('bn', 'Bengali'),
('pa', 'Punjabi'),
('or', 'Odia')
ON CONFLICT (code) DO NOTHING;

-- 5. SEED INITIAL SKILLS
INSERT INTO public.skills (name, category) VALUES
-- Trade Skills
('Electrician', 'Trades'),
('Plumber', 'Trades'),
('Carpenter', 'Trades'),
('Painter', 'Trades'),
('Mechanic', 'Trades'),
('Welder', 'Trades'),

-- Services
('Driver', 'Logistics'),
('Delivery Partner', 'Logistics'),
('Tailor', 'Services'),
('Beautician', 'Services'),
('Housekeeping', 'Services'),
('Security Guard', 'Services'),
('Domestic Helper', 'Services'),
('Tutor', 'Education'),

-- Agriculture & Outdoors
('Farm Worker', 'Agriculture'),
('Garden Worker', 'Agriculture'),
('Construction Worker', 'Construction'),

-- Digital & Creative
('Software Developer', 'Technology'),
('UI/UX Designer', 'Technology'),
('Content Creator', 'Creative'),
('Video Editor', 'Creative'),
('Data Entry Operator', 'Technology')
ON CONFLICT (name) DO NOTHING;

-- 6. SEED OPPORTUNITY CATEGORIES
INSERT INTO public.opportunity_categories (name_key, description_key) VALUES
('categories.trades', 'categories.desc.trades'),
('categories.logistics', 'categories.desc.logistics'),
('categories.services', 'categories.desc.services'),
('categories.agriculture', 'categories.desc.agriculture'),
('categories.technology', 'categories.desc.technology'),
('categories.education', 'categories.desc.education'),
('categories.chores', 'categories.desc.chores'),
('categories.retail', 'categories.desc.retail'),
('categories.hospitality', 'categories.desc.hospitality'),
('categories.construction', 'categories.desc.construction')
ON CONFLICT (name_key) DO NOTHING;

-- 7. SEED OPPORTUNITY TYPES
INSERT INTO public.opportunity_types (name_key) VALUES
('types.permanent', 'types.desc.permanent'),
('types.part_time', 'types.desc.part_time'),
('types.internship', 'types.desc.internship'),
('types.freelance', 'types.desc.freelance'),
('types.daily_wage', 'types.desc.daily_wage'),
('types.hourly', 'types.desc.hourly'),
('types.weekly_contract', 'types.desc.weekly_contract'),
('types.temporary', 'types.desc.temporary')
ON CONFLICT (name_key) DO NOTHING;
