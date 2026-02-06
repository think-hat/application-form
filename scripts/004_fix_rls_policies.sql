-- Fix RLS policies to avoid infinite recursion
-- The issue: We're using cookie-based auth with service role client, not Supabase Auth
-- Solution: Disable RLS on admins table since we handle auth in application code

-- Drop all existing policies on admins table
DROP POLICY IF EXISTS "Super admin full access" ON public.admins;
DROP POLICY IF EXISTS "Admin read access" ON public.admins;
DROP POLICY IF EXISTS "Admin update access" ON public.admins;
DROP POLICY IF EXISTS "State admin self access" ON public.admins;
DROP POLICY IF EXISTS "Admin update self" ON public.admins;

-- Disable RLS on admins table
-- We handle admin authentication and authorization in application code using cookies
-- and the service role client, so RLS is not needed here
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on applications for public access control
-- Update applications policies to work without auth.uid()
DROP POLICY IF EXISTS "Admin full access to applications" ON public.applications;
DROP POLICY IF EXISTS "State admin view own state applications" ON public.applications;

-- Recreate application policies without auth.uid() dependency
-- Since we use service role client with auth checks in code, we can simplify these

-- Public can still check and insert
-- (These policies are already correct)

-- Note: Admin access to applications is now handled via service role client
-- in the API routes, not through RLS policies

-- Keep audit logs RLS but fix the policy
DROP POLICY IF EXISTS "Admin view audit logs" ON public.admin_audit_logs;

-- Disable RLS on audit logs as well since we use service role client
ALTER TABLE public.admin_audit_logs DISABLE ROW LEVEL SECURITY;

-- Add comment to document the approach
COMMENT ON TABLE public.admins IS 'Authentication handled via cookie-based sessions in application code. RLS disabled to avoid infinite recursion.';
COMMENT ON TABLE public.admin_audit_logs IS 'Access controlled via service role client in application code. RLS disabled.';
